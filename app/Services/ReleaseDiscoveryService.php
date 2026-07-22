<?php

namespace App\Services;

use App\Enums\ReleaseCompatibility;
use App\Jobs\SendAlert;
use App\Models\Organization;
use App\Models\UpdateReleaseState;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ReleaseDiscoveryService
{
    public function check(bool $force = false): UpdateReleaseState
    {
        $organization = Organization::query()->firstOrFail();
        $state = UpdateReleaseState::query()->firstOrCreate([
            'organization_id' => $organization->id,
        ]);

        if (! $force && $state->last_attempt_at?->isAfter(now()->subHour())) {
            return $state;
        }

        return Cache::lock('netkeep:update-check', 120)->block(5, function () use ($force, $state): UpdateReleaseState {
            $state->refresh();
            if (! $force && $state->last_attempt_at?->isAfter(now()->subHour())) {
                return $state;
            }

            $state->update([
                'status' => 'checking',
                'last_attempt_at' => now(),
                'last_error_code' => null,
            ]);

            try {
                $response = $this->releaseRequest($state->etag);
                if ($response->status() === 304) {
                    $current = ReleaseVersion::normalize((string) config('netkeep.version')) ?? '0.0.0';
                    if (! $state->available_version || ReleaseVersion::compare($state->available_version, $current) <= 0) {
                        $this->clearCandidate($state, $state->etag);

                        return $state->refresh();
                    }
                    $state->update([
                        'status' => 'available',
                        'last_success_at' => now(),
                    ]);

                    return $state->refresh();
                }
                $response->throw();
                if (strlen($response->body()) > 2097152) {
                    throw new RuntimeException('release_response_too_large');
                }
                $candidate = $this->candidate($response);
                $etag = $response->header('ETag');
                if ($candidate === null) {
                    $this->clearCandidate($state, $etag ?: null);

                    return $state->refresh();
                }

                $manifest = $this->manifest($candidate['assets']);
                $current = ReleaseVersion::normalize((string) config('netkeep.version')) ?? '0.0.0';
                $versionFamily = ReleaseVersion::major($candidate['version']) === ReleaseVersion::major($current)
                    ? ReleaseCompatibility::SameMajor
                    : ReleaseCompatibility::MajorUpgrade;
                $manualEligible = $this->manualEligible($manifest, $candidate['version'], $current);
                $compatibility = $manualEligible ? $versionFamily : ReleaseCompatibility::Unsupported;
                $automaticEligible = $versionFamily === ReleaseCompatibility::SameMajor
                    && $manualEligible
                    && (bool) ($manifest['automatic_eligible'] ?? false);
                $newNotification = $state->last_notified_version !== $candidate['version'];

                $state->update([
                    'status' => 'available',
                    'etag' => $etag ?: null,
                    'available_version' => $candidate['version'],
                    'compatibility' => $compatibility,
                    'release_url' => $candidate['release_url'],
                    'published_at' => $candidate['published_at'],
                    'assets' => $candidate['assets'],
                    'manual_eligible' => $manualEligible,
                    'automatic_eligible' => $automaticEligible,
                    'rollback_safe' => (bool) ($manifest['rollback_safe'] ?? false),
                    'requires_host_steps' => (bool) ($manifest['requires_host_steps'] ?? true),
                    'estimated_downtime_seconds' => min(3600, max(30, (int) ($manifest['estimated_downtime_seconds'] ?? 300))),
                    'last_success_at' => now(),
                    'last_notified_version' => $newNotification ? $candidate['version'] : $state->last_notified_version,
                ]);

                if ($newNotification) {
                    SendAlert::dispatch('update', 'netkeep.alerts.update_available', [
                        'current_version' => $current,
                        'version' => $candidate['version'],
                        'compatibility' => $compatibility->value,
                        'release_url' => $candidate['release_url'],
                    ]);
                }

                return $state->refresh();
            } catch (\Throwable $exception) {
                $state->update([
                    'status' => 'failed',
                    'last_error_code' => $this->errorCode($exception),
                ]);

                return $state->refresh();
            }
        });
    }

    private function releaseRequest(?string $etag): Response
    {
        $headers = [
            'Accept' => 'application/vnd.github+json',
            'X-GitHub-Api-Version' => '2022-11-28',
            'User-Agent' => 'NetKeep/'.(ReleaseVersion::normalize((string) config('netkeep.version')) ?? 'dev'),
        ];
        if (filled($etag)) {
            $headers['If-None-Match'] = $etag;
        }

        return Http::withHeaders($headers)
            ->connectTimeout(5)
            ->timeout(10)
            ->get((string) config('netkeep.updates.releases_url'));
    }

    /**
     * @return array{version:string,release_url:string,published_at:?string,assets:array<string, array<string, mixed>>}|null
     */
    private function candidate(Response $response): ?array
    {
        $payload = $response->json();
        if (! is_array($payload)) {
            throw new RuntimeException('release_response_invalid');
        }
        $current = ReleaseVersion::normalize((string) config('netkeep.version'));
        if ($current === null) {
            return null;
        }

        $releases = collect($payload)
            ->filter(fn (mixed $release): bool => is_array($release)
                && ! (bool) ($release['draft'] ?? true)
                && ! (bool) ($release['prerelease'] ?? true)
                && ReleaseVersion::normalize($release['tag_name'] ?? null) !== null)
            ->map(function (array $release): array {
                $assets = [];
                $assetPayload = $release['assets'] ?? [];
                if (is_array($assetPayload)) {
                    foreach ($assetPayload as $asset) {
                        if (! is_array($asset) || ! is_string($asset['name'] ?? null)) {
                            continue;
                        }
                        $assets[$asset['name']] = [
                            'url' => $asset['browser_download_url'] ?? null,
                            'digest' => $asset['digest'] ?? null,
                            'size' => (int) ($asset['size'] ?? 0),
                        ];
                    }
                }

                return [
                    'version' => ReleaseVersion::normalize((string) $release['tag_name']),
                    'release_url' => (string) ($release['html_url'] ?? ''),
                    'published_at' => is_string($release['published_at'] ?? null) ? $release['published_at'] : null,
                    'assets' => $assets,
                ];
            })
            ->filter(fn (array $release): bool => $release['release_url'] === 'https://github.com/lrqnet/NetKeep/releases/tag/v'.$release['version'])
            ->filter(fn (array $release): bool => ReleaseVersion::compare($release['version'], $current) > 0)
            ->sort(fn (array $left, array $right): int => ReleaseVersion::compare($right['version'], $left['version']))
            ->values();

        return $releases->first();
    }

    /**
     * @param  array<string, array<string, mixed>>  $assets
     * @return array<string, mixed>
     */
    private function manifest(array $assets): array
    {
        $asset = $assets['update-manifest.json'] ?? null;
        if (! is_array($asset) || ! $this->trustedAssetUrl($asset['url'] ?? null) || (int) ($asset['size'] ?? 0) > 1048576) {
            return [];
        }

        $response = Http::acceptJson()->connectTimeout(5)->timeout(10)->get((string) $asset['url']);
        $response->throw();
        if (strlen($response->body()) > 1048576) {
            throw new RuntimeException('release_manifest_too_large');
        }
        $manifest = $response->json();

        return is_array($manifest) ? $manifest : [];
    }

    /**
     * @param  array<string, mixed>  $manifest
     */
    private function manualEligible(array $manifest, string $candidate, string $current): bool
    {
        if (ReleaseVersion::normalize($manifest['version'] ?? null) !== $candidate) {
            return false;
        }
        $minimum = ReleaseVersion::normalize($manifest['minimum_source_version'] ?? null);
        $majors = array_map('intval', is_array($manifest['manual_source_majors'] ?? null) ? $manifest['manual_source_majors'] : []);

        return $minimum !== null
            && ReleaseVersion::compare($current, $minimum) >= 0
            && in_array(ReleaseVersion::major($current), $majors, true)
            && ! (bool) ($manifest['requires_host_steps'] ?? true);
    }

    private function trustedAssetUrl(mixed $url): bool
    {
        return is_string($url)
            && preg_match('#^https://github\.com/lrqnet/NetKeep/releases/download/v\d+\.\d+\.\d+/[A-Za-z0-9._-]+$#', $url) === 1;
    }

    private function clearCandidate(UpdateReleaseState $state, ?string $etag): void
    {
        $state->update([
            'status' => 'up_to_date',
            'etag' => $etag,
            'available_version' => null,
            'compatibility' => null,
            'release_url' => null,
            'published_at' => null,
            'assets' => null,
            'manual_eligible' => false,
            'automatic_eligible' => false,
            'rollback_safe' => false,
            'requires_host_steps' => false,
            'last_success_at' => now(),
        ]);
    }

    private function errorCode(\Throwable $exception): string
    {
        if ($exception instanceof RuntimeException && str_starts_with($exception->getMessage(), 'release_')) {
            return $exception->getMessage();
        }

        return 'release_check_failed';
    }
}
