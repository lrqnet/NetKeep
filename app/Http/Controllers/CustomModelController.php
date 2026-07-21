<?php

namespace App\Http\Controllers;

use App\Enums\DangerousFeature;
use App\Enums\DeviceApprovalStatus;
use App\Jobs\TestCustomModel;
use App\Models\CustomModel;
use App\Models\Device;
use App\Services\AuditLogger;
use App\Services\CustomModelPublisher;
use App\Services\DangerousFeatureService;
use App\Services\DeviceApprovalService;
use App\Services\GuidedModelPolicy;
use App\Services\KnownHostsWriter;
use App\Services\ModelRubyGenerator;
use App\Services\OxidizedClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomModelController extends Controller
{
    public function index(Request $request, DangerousFeatureService $dangerous): Response
    {
        $rawEnabled = $dangerous->enabled(DangerousFeature::RawRuby);

        return Inertia::render('models/index', [
            'models' => CustomModel::query()->with('author:id,name')->latest()->get(),
            'catalog' => [
                'version' => config('oxidized-models.version'),
                'models' => config('oxidized-models.models'),
            ],
            'testDevices' => Device::query()
                ->where('enabled', true)
                ->where('approval_status', DeviceApprovalStatus::Approved)
                ->whereIn('oxidized_model', CustomModel::query()->pluck('slug'))
                ->orderBy('name')
                ->get(['id', 'name', 'oxidized_model']),
            'warning' => __('netkeep.models.warning'),
            'rawEnabled' => $rawEnabled,
            'canManageRaw' => $rawEnabled && $request->user()->role->canManageOwnership(),
            'reviewedDrivers' => config('oxidized-security.reviewed_drivers'),
            'safeCommands' => config('oxidized-security.safe_commands'),
            'sessionCommands' => config('oxidized-security.session_commands'),
            'logoutCommands' => config('oxidized-security.logout_commands'),
        ]);
    }

    public function store(
        Request $request,
        ModelRubyGenerator $generator,
        GuidedModelPolicy $policy,
        DangerousFeatureService $dangerous,
        AuditLogger $audit,
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'alpha_dash:ascii', 'max:120', 'unique:custom_models,slug'],
            'source' => ['required', Rule::in(['guided', 'raw'])],
            'base_model' => ['required_if:source,guided', 'nullable', 'alpha_dash:ascii', 'max:120'],
            'ruby_source' => ['required_if:source,raw', 'nullable', 'string', 'max:200000'],
            'definition' => ['required_if:source,guided', 'nullable', 'array'],
            'definition.prompt' => ['nullable', 'string', 'max:255'],
            'definition.comment' => ['nullable', 'string', 'max:20'],
            'definition.post_login' => ['nullable', 'string', 'max:255'],
            'definition.enable' => ['nullable', 'boolean'],
            'definition.commands' => ['nullable', 'array', 'max:100'],
            'definition.commands.*' => ['string', 'max:1000'],
            'definition.filters' => ['nullable', 'array', 'max:100'],
            'definition.filters.*' => ['string', 'max:1000'],
            'definition.logout' => ['nullable', 'string', 'max:255'],
        ]);
        $this->authorizeSource($request, $validated['source'], $dangerous);
        if ($validated['source'] === 'guided') {
            $policy->validate((string) ($validated['base_model'] ?? ''), $validated['definition'] ?? []);
        }

        $slug = $validated['slug'] ?: Str::slug($validated['name'], '_');
        $source = $validated['source'] === 'guided'
            ? $generator->generate($slug, $validated['definition'] ?? [])
            : (string) $validated['ruby_source'];

        $model = CustomModel::query()->create([
            'name' => $validated['name'],
            'slug' => $slug,
            'source' => $validated['source'],
            'base_model' => $validated['base_model'] ?? null,
            'ruby_source' => $source,
            'definition' => $validated['definition'] ?? null,
            'created_by' => $request->user()->id,
        ]);
        $audit->record('model.created', $model, ['source' => $model->source, 'slug' => $model->slug]);

        return back()->with('success', __('netkeep.models.draft_created'));
    }

    public function update(
        Request $request,
        CustomModel $model,
        ModelRubyGenerator $generator,
        GuidedModelPolicy $policy,
        DangerousFeatureService $dangerous,
        AuditLogger $audit,
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'source' => ['required', Rule::in(['guided', 'raw'])],
            'base_model' => ['required_if:source,guided', 'nullable', 'alpha_dash:ascii', 'max:120'],
            'ruby_source' => ['required_if:source,raw', 'nullable', 'string', 'max:200000'],
            'definition' => ['required_if:source,guided', 'nullable', 'array'],
            'definition.prompt' => ['nullable', 'string', 'max:255'],
            'definition.comment' => ['nullable', 'string', 'max:20'],
            'definition.post_login' => ['nullable', 'string', 'max:255'],
            'definition.enable' => ['nullable', 'boolean'],
            'definition.commands' => ['nullable', 'array', 'max:100'],
            'definition.commands.*' => ['string', 'max:1000'],
            'definition.filters' => ['nullable', 'array', 'max:100'],
            'definition.filters.*' => ['string', 'max:1000'],
            'definition.logout' => ['nullable', 'string', 'max:255'],
        ]);
        $this->authorizeSource($request, $validated['source'], $dangerous);
        if ($validated['source'] === 'guided') {
            $policy->validate((string) ($validated['base_model'] ?? $model->base_model), $validated['definition'] ?? []);
        }
        $source = $validated['source'] === 'guided'
            ? $generator->generate($model->slug, $validated['definition'] ?? [])
            : (string) $validated['ruby_source'];

        $model->update([
            'name' => $validated['name'],
            'source' => $validated['source'],
            'base_model' => $validated['source'] === 'guided'
                ? $validated['base_model']
                : null,
            'ruby_source' => $source,
            'definition' => $validated['definition'] ?? null,
            'version' => $model->version + 1,
            'status' => 'draft',
            'published_at' => null,
        ]);
        $audit->record('model.updated', $model, ['version' => $model->version]);

        return back()->with('success', __('netkeep.models.draft_updated'));
    }

    public function publish(
        Request $request,
        CustomModel $model,
        CustomModelPublisher $publisher,
        OxidizedClient $oxidized,
        AuditLogger $audit,
        DangerousFeatureService $dangerous,
        DeviceApprovalService $approval,
        KnownHostsWriter $knownHosts,
    ): RedirectResponse {
        $this->authorizeSource($request, $model->source, $dangerous);
        $error = $publisher->validate($model);
        if ($error) {
            $model->update(['status' => 'error', 'last_validation_error' => $error]);
            $audit->record('model.validation_failed', $model, ['error' => $error]);

            return back()->with('error', __('netkeep.models.ruby_invalid', ['error' => $error]));
        }

        $invalidatedDevices = $this->invalidateAssignedDevices($model, $approval);
        if ($invalidatedDevices > 0) {
            $knownHosts->write();
            if (! $oxidized->reload()) {
                $model->update(['status' => 'error', 'last_validation_error' => __('netkeep.models.engine_unavailable')]);
                $audit->record('model.publish_failed', $model, [
                    'engine_pause_failed' => true,
                    'invalidated_devices' => $invalidatedDevices,
                ]);

                return back()->with('error', __('netkeep.models.engine_unavailable'));
            }
        }

        $previous = $publisher->publish($model);
        if (! $oxidized->reload()) {
            $publisher->rollback($model, $previous);
            $oxidized->reload();
            $model->update(['status' => 'error', 'last_validation_error' => __('netkeep.models.engine_unavailable')]);
            $audit->record('model.publish_failed', $model, ['rollback_required' => true]);

            return back()->with('error', __('netkeep.models.rollback'));
        }

        $model->update([
            'status' => 'published',
            'published_at' => now(),
            'last_validation_error' => null,
        ]);
        $audit->record('model.published', $model, [
            'version' => $model->version,
            'invalidated_devices' => $invalidatedDevices,
        ]);

        return back()->with('success', __('netkeep.models.published'));
    }

    public function test(Request $request, CustomModel $model, CustomModelPublisher $publisher, AuditLogger $audit): RedirectResponse
    {
        $this->authorizeSource($request, $model->source, app(DangerousFeatureService::class));
        $data = $request->validate(['device_id' => ['required', 'exists:devices,id']]);
        $device = Device::query()
            ->whereKey((int) $data['device_id'])
            ->firstOrFail();
        abort_unless(
            $device->enabled
            && $device->approval_status === DeviceApprovalStatus::Approved
            && $device->oxidized_model === $model->slug,
            422,
            __('netkeep.models.assign_before_test'),
        );

        if ($error = $publisher->validate($model)) {
            $model->update([
                'last_test_status' => 'failed',
                'last_test_message' => $error,
                'last_tested_at' => now(),
            ]);

            return back()->with('error', __('netkeep.models.ruby_invalid', ['error' => $error]));
        }

        TestCustomModel::dispatch($model->id, $device->id);
        $audit->record('model.test_queued', $model, ['device_id' => $device->id]);

        return back()->with('success', __('netkeep.models.test_queued'));
    }

    public function destroy(CustomModel $model, AuditLogger $audit): RedirectResponse
    {
        abort_if($model->status === 'published', 422, __('netkeep.models.publish_another'));
        abort_if($model->devices()->exists(), 422, __('netkeep.models.in_use'));
        $audit->record('model.deleted', $model, ['slug' => $model->slug]);
        $model->delete();

        return back()->with('success', __('netkeep.models.deleted'));
    }

    private function authorizeSource(
        Request $request,
        string $source,
        DangerousFeatureService $dangerous,
    ): void {
        if ($source !== 'raw') {
            return;
        }

        abort_unless($request->user()->role->canManageOwnership(), 403);
        abort_unless($dangerous->enabled(DangerousFeature::RawRuby), 422, __('netkeep.models.raw_disabled'));
        abort_unless(
            (int) $request->session()->get('auth.password_confirmed_at', 0) >= now()->subMinutes(5)->timestamp,
            423,
        );
    }

    private function invalidateAssignedDevices(
        CustomModel $model,
        DeviceApprovalService $approval,
    ): int {
        $devices = Device::query()
            ->where(function ($query) use ($model): void {
                $query
                    ->where('custom_model_id', $model->id)
                    ->orWhere('oxidized_model', $model->slug);
            })
            ->where(function ($query): void {
                $query
                    ->where('enabled', true)
                    ->orWhere('approval_status', DeviceApprovalStatus::Approved);
            })
            ->get();

        foreach ($devices as $device) {
            $device->forceFill(['custom_model_id' => $model->id])->save();
            $approval->invalidate($device);
        }

        return $devices->count();
    }
}
