<?php

namespace Tests\Feature\NetKeep;

use App\Services\InstallationClaimService;
use App\Services\RestoreCoordinator;
use Mockery;
use Tests\TestCase;

class RestoreCommandTest extends TestCase
{
    protected bool $withCompletedSetup = false;

    public function test_finalize_invalidates_the_installation_claim_token(): void
    {
        $operation = '216be6b8-44e0-4f24-a909-d9f41545526c';
        $restores = Mockery::mock(RestoreCoordinator::class);
        $restores->shouldReceive('finalize')->once()->with($operation);
        $claims = Mockery::mock(InstallationClaimService::class);
        $claims->shouldReceive('invalidate')->once();
        $this->app->instance(RestoreCoordinator::class, $restores);
        $this->app->instance(InstallationClaimService::class, $claims);

        $this->artisan('netkeep:restore', [
            'action' => 'finalize',
            '--operation' => $operation,
            '--force' => true,
        ])->assertExitCode(0);
    }
}
