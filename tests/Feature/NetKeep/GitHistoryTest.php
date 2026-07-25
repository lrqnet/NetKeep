<?php

namespace Tests\Feature\NetKeep;

use App\Enums\UserRole;
use App\Exceptions\GitRepositoryUnavailable;
use App\Models\Device;
use App\Models\DeviceGroup;
use App\Models\User;
use App\Services\GitHistory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class GitHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_downloads_and_diffs_committed_configurations(): void
    {
        $repository = storage_path('framework/testing-git-history');
        File::deleteDirectory($repository);
        File::ensureDirectoryExists($repository);
        config(['netkeep.oxidized.git_path' => $repository]);
        $this->git($repository, ['init', '--initial-branch=main']);
        $this->git($repository, ['config', 'user.name', 'NetKeep Test']);
        $this->git($repository, ['config', 'user.email', 'test@example.com']);
        $group = DeviceGroup::query()->create(['name' => 'core']);
        $device = Device::query()->create([
            'name' => 'router-01',
            'ip_address' => '192.0.2.10',
            'oxidized_model' => 'ios',
            'device_group_id' => $group->id,
        ]);

        $path = $repository.'/group-'.$group->id.'/'.$device->uuid;
        File::ensureDirectoryExists(dirname($path));
        File::put($path, "hostname router-01\nversion 1\n");
        $this->git($repository, ['add', '.']);
        $this->git($repository, ['commit', '-m', 'first backup']);
        $first = trim($this->git($repository, ['rev-parse', 'HEAD']));
        File::put($path, "hostname router-01\nversion 2\n");
        $this->git($repository, ['add', '.']);
        $this->git($repository, ['commit', '-m', 'second backup']);
        $second = trim($this->git($repository, ['rev-parse', 'HEAD']));

        $history = app(GitHistory::class);
        $this->assertCount(2, $history->versions($device));
        $this->assertStringContainsString('version 2', $history->content($device));
        $diff = $history->diff($device, $first, $second);
        $this->assertStringContainsString('-version 1', $diff);
        $this->assertStringContainsString('+version 2', $diff);
    }

    public function test_unavailable_repository_is_explicit_and_the_page_remains_safe(): void
    {
        $repository = storage_path('framework/missing-git-history');
        File::deleteDirectory($repository);
        config(['netkeep.oxidized.git_path' => $repository]);
        $device = Device::query()->create([
            'name' => 'router-02',
            'ip_address' => '198.51.100.20',
            'oxidized_model' => 'ios',
        ]);
        $user = User::factory()->create(['role' => UserRole::Owner]);

        $this->actingAs($user)
            ->get(route('configurations.show', $device))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('configurations/show')
                ->where('historyUnavailable', true)
                ->has('versions', 0)
                ->where('content', ''));
        $this->actingAs($user)
            ->get(route('configurations.download', $device))
            ->assertStatus(503)
            ->assertSeeText(__('netkeep.config.history_unavailable'));

        try {
            app(GitHistory::class)->versions($device);
            $this->fail('The unavailable repository should be explicit.');
        } catch (GitRepositoryUnavailable $exception) {
            $this->assertSame('git_repository_unavailable', $exception->getMessage());
            $this->assertStringNotContainsString($repository, $exception->getMessage());
        }
    }

    public function test_collection_tab_can_be_opened_directly(): void
    {
        $device = Device::query()->create([
            'name' => 'router-03',
            'ip_address' => '203.0.113.20',
            'oxidized_model' => 'ios',
        ]);
        $user = User::factory()->create(['role' => UserRole::Viewer]);

        $this->actingAs($user)
            ->get(route('devices.edit', $device).'?tab=collections')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('devices/edit')
                ->where('initialTab', 'collections'));
    }

    /**
     * @param  array<int, string>  $arguments
     */
    private function git(string $repository, array $arguments): string
    {
        $process = new Process(['git', '-C', $repository, ...$arguments]);
        $process->mustRun();

        return $process->getOutput();
    }
}
