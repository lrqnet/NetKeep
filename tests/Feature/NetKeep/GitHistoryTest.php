<?php

namespace Tests\Feature\NetKeep;

use App\Models\Device;
use App\Models\DeviceGroup;
use App\Services\GitHistory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
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
