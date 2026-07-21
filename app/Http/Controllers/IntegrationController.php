<?php

namespace App\Http\Controllers;

use App\Models\InventorySource;
use App\Services\AuditLogger;
use App\Services\InventorySynchronizer;
use App\Services\OutboundUrlGuard;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class IntegrationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('integrations/index', [
            'inventorySources' => InventorySource::query()->orderBy('name')->get()->map(fn (InventorySource $source): array => [
                'id' => $source->id,
                'type' => $source->type,
                'name' => $source->name,
                'base_url' => $source->base_url,
                'enabled' => $source->enabled,
                'sync_interval' => $source->sync_interval,
                'last_synced_at' => $source->last_synced_at,
                'last_error' => $source->last_error,
                'has_token' => filled($source->token),
            ]),
        ]);
    }

    public function storeInventory(Request $request, AuditLogger $audit, OutboundUrlGuard $urls): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['librenms', 'netbox'])],
            'name' => ['required', 'string', 'max:120'],
            'base_url' => ['required', 'url:http,https', 'max:1000', function (string $attribute, mixed $value, \Closure $fail): void {
                if (parse_url((string) $value, PHP_URL_USER) || parse_url((string) $value, PHP_URL_PASS)) {
                    $fail(__('netkeep.integrations.url_credentials'));
                }
            }],
            'token' => ['required', 'string', 'max:10000'],
            'sync_interval' => ['required', 'integer', 'between:300,86400'],
            'enabled' => ['boolean'],
            'grace_period' => ['nullable', 'integer', 'between:300,2592000'],
        ]);
        $urls->assertAllowed($data['base_url']);
        $data['settings'] = ['grace_period' => (int) ($data['grace_period'] ?? 86400)];
        unset($data['grace_period']);
        $source = InventorySource::query()->create($data);
        $audit->record('integration.inventory_created', $source, ['type' => $source->type, 'base_url' => $source->base_url]);

        return back()->with('success', __('netkeep.integrations.inventory_created'));
    }

    public function syncInventory(InventorySource $source, InventorySynchronizer $sync, AuditLogger $audit): RedirectResponse
    {
        try {
            $result = $sync->sync($source);
            $audit->record('integration.inventory_synced', $source, $result);

            return back()->with('success', __('netkeep.integrations.sync_completed', $result));
        } catch (\Throwable $exception) {
            $source->update(['last_error' => $exception->getMessage()]);
            $audit->record('integration.inventory_failed', $source, ['error' => $exception->getMessage()]);

            return back()->with('error', __('netkeep.integrations.sync_failed'));
        }
    }
}
