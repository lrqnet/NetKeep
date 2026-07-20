<?php

namespace Tests;

use App\Models\Organization;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Http;
use Laravel\Fortify\Features;

abstract class TestCase extends BaseTestCase
{
    protected bool $withCompletedSetup = true;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake();

        if ($this->withCompletedSetup) {
            Organization::query()->firstOrCreate(
                ['slug' => 'test-network'],
                [
                    'name' => 'Test Network',
                    'locale' => 'pt_BR',
                    'timezone' => 'UTC',
                    'setup_completed_at' => now(),
                ],
            );
        }
    }

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }
}
