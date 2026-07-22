<?php

namespace Tests\Feature\NetKeep;

use App\Jobs\SendAlert;
use App\Models\Organization;
use App\Models\UpdateReleaseState;
use App\Services\ReleaseDiscoveryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ReleaseDiscoveryServiceTest extends TestCase
{
    use RefreshDatabase;

    private string $releasesUrl = 'https://api.github.com/repos/lrqnet/NetKeep/releases?per_page=30';

    private string $manifestUrl = 'https://github.com/lrqnet/NetKeep/releases/download/v1.0.2/update-manifest.json';

    protected function setUp(): void
    {
        parent::setUp();

        Http::swap(new Factory);
        Http::preventStrayRequests();
        Queue::fake();
        config([
            'netkeep.version' => '1.0.0',
            'netkeep.updates.releases_url' => $this->releasesUrl,
        ]);
    }

    public function test_it_selects_the_latest_stable_signed_release_candidate(): void
    {
        Http::fake([
            $this->releasesUrl => Http::response([
                $this->release('v1.0.1', prerelease: true),
                $this->release('v1.0.2'),
                $this->release('v1.0.3', draft: true),
            ], 200, ['ETag' => '"release-etag"']),
            $this->manifestUrl => Http::response($this->manifest()),
        ]);

        $state = app(ReleaseDiscoveryService::class)->check();

        $this->assertSame('available', $state->status);
        $this->assertSame('1.0.2', $state->available_version);
        $this->assertTrue($state->manual_eligible);
        $this->assertTrue($state->automatic_eligible);
        $this->assertSame('"release-etag"', $state->etag);
        Queue::assertPushed(SendAlert::class, fn (SendAlert $job): bool => $job->event === 'update');
    }

    public function test_it_checks_at_most_once_per_hour_unless_forced(): void
    {
        Http::fake([
            $this->releasesUrl => Http::sequence()
                ->push([$this->release('v1.0.2')], 200, ['ETag' => '"first"'])
                ->push([], 304),
            $this->manifestUrl => Http::response($this->manifest()),
        ]);

        $service = app(ReleaseDiscoveryService::class);
        $service->check();
        $service->check();
        $service->check(true);

        Http::assertSentCount(3);
        Http::assertSent(fn (Request $request): bool => $request->url() === $this->releasesUrl
            && $request->hasHeader('If-None-Match', '"first"'));
    }

    public function test_it_preserves_the_last_candidate_when_github_is_unavailable(): void
    {
        $organization = Organization::query()->firstOrFail();
        UpdateReleaseState::query()->create([
            'organization_id' => $organization->id,
            'status' => 'available',
            'available_version' => '1.0.2',
            'manual_eligible' => true,
            'automatic_eligible' => true,
            'last_success_at' => now()->subHour(),
        ]);
        Http::fake([$this->releasesUrl => Http::response([], 503)]);

        $state = app(ReleaseDiscoveryService::class)->check(true);

        $this->assertSame('failed', $state->status);
        $this->assertSame('1.0.2', $state->available_version);
        $this->assertSame('release_check_failed', $state->last_error_code);
        $this->assertNotNull($state->last_success_at);
    }

    public function test_it_does_not_repeat_the_alert_for_the_same_version(): void
    {
        Http::fake([
            $this->releasesUrl => Http::response([$this->release('v1.0.2')]),
            $this->manifestUrl => Http::response($this->manifest()),
        ]);

        $service = app(ReleaseDiscoveryService::class);
        $service->check(true);
        $service->check(true);

        Queue::assertPushed(SendAlert::class, 1);
    }

    public function test_it_ignores_a_release_with_an_untrusted_public_url(): void
    {
        $release = $this->release('v1.0.2');
        $release['html_url'] = 'https://example.invalid/v1.0.2';
        Http::fake([$this->releasesUrl => Http::response([$release])]);

        $state = app(ReleaseDiscoveryService::class)->check(true);

        $this->assertSame('up_to_date', $state->status);
        $this->assertNull($state->available_version);
        Http::assertSentCount(1);
    }

    public function test_a_not_modified_response_clears_an_already_installed_candidate(): void
    {
        $organization = Organization::query()->firstOrFail();
        UpdateReleaseState::query()->create([
            'organization_id' => $organization->id,
            'status' => 'available',
            'etag' => '"current"',
            'available_version' => '1.0.2',
            'manual_eligible' => true,
            'automatic_eligible' => true,
        ]);
        config(['netkeep.version' => '1.0.2']);
        Http::fake([$this->releasesUrl => Http::response([], 304)]);

        $state = app(ReleaseDiscoveryService::class)->check(true);

        $this->assertSame('up_to_date', $state->status);
        $this->assertNull($state->available_version);
        $this->assertFalse($state->manual_eligible);
    }

    /** @return array<string, mixed> */
    private function release(string $tag, bool $draft = false, bool $prerelease = false): array
    {
        return [
            'tag_name' => $tag,
            'draft' => $draft,
            'prerelease' => $prerelease,
            'html_url' => "https://github.com/lrqnet/NetKeep/releases/tag/{$tag}",
            'published_at' => '2026-07-21T12:00:00Z',
            'assets' => [[
                'name' => 'update-manifest.json',
                'browser_download_url' => $this->manifestUrl,
                'digest' => 'sha256:'.str_repeat('a', 64),
                'size' => 512,
            ]],
        ];
    }

    /** @return array<string, mixed> */
    private function manifest(): array
    {
        return [
            'schema' => 1,
            'version' => '1.0.2',
            'minimum_source_version' => '1.0.0',
            'manual_source_majors' => [1],
            'automatic_eligible' => true,
            'rollback_safe' => true,
            'requires_host_steps' => false,
            'estimated_downtime_seconds' => 300,
        ];
    }
}
