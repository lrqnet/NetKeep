<?php

namespace App\Http\Controllers;

use App\Models\CredentialProfile;
use App\Services\AuditLogger;
use App\Services\DeviceApprovalService;
use App\Services\KnownHostsWriter;
use App\Services\OxidizedClient;
use App\Services\OxidizedCredentialMaterializer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CredentialProfileController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('credentials/index', [
            'profiles' => CredentialProfile::query()
                ->withCount('devices')
                ->orderBy('name')
                ->get()
                ->map(fn (CredentialProfile $profile): array => [
                    'id' => $profile->id,
                    'name' => $profile->name,
                    'username' => $profile->username,
                    'notes' => $profile->notes,
                    'devices_count' => $profile->devices_count,
                    'has_password' => filled($profile->password),
                    'has_enable' => filled($profile->enable_secret),
                    'has_private_key' => filled($profile->private_key),
                    'updated_at' => $profile->updated_at,
                ]),
        ]);
    }

    public function store(
        Request $request,
        AuditLogger $audit,
        OxidizedCredentialMaterializer $materializer,
        OxidizedClient $oxidized,
    ): RedirectResponse {
        $data = $this->validated($request);
        $profile = CredentialProfile::query()->create($data + ['created_by' => $request->user()->id]);
        $materializer->sync($profile);
        $oxidized->reload();
        $audit->record('credential.created', $profile, ['fields' => array_keys(array_filter($data))]);

        return back()->with('success', __('netkeep.credentials.created'));
    }

    public function update(
        Request $request,
        CredentialProfile $credential,
        AuditLogger $audit,
        DeviceApprovalService $approval,
        KnownHostsWriter $knownHosts,
        OxidizedCredentialMaterializer $materializer,
        OxidizedClient $oxidized,
    ): RedirectResponse {
        $data = $this->validated($request, $credential);
        foreach (['password', 'enable_secret', 'private_key', 'private_key_passphrase'] as $secret) {
            if (($data[$secret] ?? '') === '') {
                unset($data[$secret]);
            }
        }
        $sensitiveFields = [
            'username',
            'password',
            'enable_secret',
            'private_key',
            'private_key_passphrase',
        ];
        $sensitiveChanged = collect($sensitiveFields)->contains(
            fn (string $field): bool => array_key_exists($field, $data)
                && $credential->getAttribute($field) !== $data[$field],
        );
        $invalidatedDevices = 0;

        DB::transaction(function () use (
            $credential,
            $data,
            $sensitiveChanged,
            $approval,
            &$invalidatedDevices,
        ): void {
            $credential->update($data);
            if (! $sensitiveChanged) {
                return;
            }

            $devices = $credential->devices()->lockForUpdate()->get();
            foreach ($devices as $device) {
                $approval->invalidate($device);
                $invalidatedDevices++;
            }
        });

        if ($invalidatedDevices > 0) {
            $knownHosts->write();
        }
        $materializer->sync($credential->refresh());
        $oxidized->reload();
        $audit->record('credential.updated', $credential, [
            'fields' => array_keys($data),
            'invalidated_devices' => $invalidatedDevices,
        ]);

        return back()->with('success', __('netkeep.credentials.updated'));
    }

    public function destroy(
        CredentialProfile $credential,
        AuditLogger $audit,
        OxidizedCredentialMaterializer $materializer,
        OxidizedClient $oxidized,
    ): RedirectResponse {
        abort_if($credential->devices()->exists(), 422, __('netkeep.credentials.in_use'));
        $audit->record('credential.deleted', $credential, ['name' => $credential->name]);
        $materializer->delete($credential);
        $credential->delete();
        $oxidized->reload();

        return back()->with('success', __('netkeep.credentials.deleted'));
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?CredentialProfile $profile = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:credential_profiles,name,'.($profile ? $profile->id : 'NULL')],
            'username' => ['nullable', 'string', 'max:255'],
            'password' => [$profile ? 'nullable' : 'required_without:private_key', 'nullable', 'string', 'max:10000'],
            'enable_secret' => ['nullable', 'string', 'max:10000'],
            'private_key' => ['nullable', 'string', 'max:65535'],
            'private_key_passphrase' => ['nullable', 'string', 'max:10000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
