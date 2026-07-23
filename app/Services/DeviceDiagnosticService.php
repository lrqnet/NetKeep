<?php

namespace App\Services;

use App\Enums\CollectionRunStatus;
use App\Enums\CollectionTrigger;
use App\Jobs\RunDeviceDiagnostic;
use App\Models\CollectionRun;
use App\Models\Device;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DeviceDiagnosticService
{
    public function request(Device $device, User $user): CollectionRun
    {
        $run = app(CollectionRequestService::class)->request(
            $device,
            CollectionTrigger::Diagnostic,
            $user,
            rejectActive: true,
        );
        DB::transaction(function () use ($run): void {
            $locked = CollectionRun::query()->lockForUpdate()->findOrFail($run->id);
            if ($locked->status !== CollectionRunStatus::Queued) {
                return;
            }
            $locked->update([
                'status' => CollectionRunStatus::Dispatched,
                'dispatched_at' => now(),
            ]);
        });
        app(CollectionRunEventService::class)->record($run->refresh(), 'dispatched');
        RunDeviceDiagnostic::dispatch($run->id);

        return $run->refresh();
    }
}
