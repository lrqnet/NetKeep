<?php

namespace App\Http\Controllers;

use App\Models\DeviceGroup;
use App\Models\HardwareModel;
use App\Models\Manufacturer;
use App\Models\Site;
use App\Models\Tag;
use App\Services\AuditLogger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('catalog/index', [
            'sites' => Site::query()->orderBy('name')->get(),
            'groups' => DeviceGroup::query()->orderBy('name')->get(),
            'tags' => Tag::query()->orderBy('name')->get(),
            'manufacturers' => Manufacturer::query()->orderBy('name')->get(),
            'hardwareModels' => HardwareModel::query()
                ->with('manufacturer:id,name')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request, AuditLogger $audit): RedirectResponse
    {
        $kind = (string) $request->input('kind');
        $model = match ($kind) {
            'site' => Site::query()->create($request->validate([
                'name' => ['required', 'string', 'max:120', 'unique:sites,name'],
                'location' => ['nullable', 'string', 'max:255'],
                'description' => ['nullable', 'string', 'max:2000'],
            ])),
            'group' => DeviceGroup::query()->create($request->validate([
                'name' => ['required', 'string', 'max:120', 'unique:device_groups,name'],
                'description' => ['nullable', 'string', 'max:2000'],
                'remove_secrets' => ['boolean'],
            ])),
            'tag' => Tag::query()->create($request->validate([
                'name' => ['required', 'string', 'max:64', 'unique:tags,name'],
                'color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            ])),
            'manufacturer' => Manufacturer::query()->create($request->validate([
                'name' => ['required', 'string', 'max:120', 'unique:manufacturers,name'],
                'website' => ['nullable', 'url:http,https', 'max:1000'],
            ])),
            'hardware_model' => HardwareModel::query()->create($request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:120',
                    Rule::unique('hardware_models')->where(
                        fn ($query) => $query->where('manufacturer_id', $request->input('manufacturer_id')),
                    ),
                ],
                'manufacturer_id' => ['nullable', 'exists:manufacturers,id'],
                'oxidized_model' => ['nullable', 'alpha_dash:ascii', 'max:120'],
            ])),
            default => abort(422, __('netkeep.catalog.invalid_type')),
        };

        $audit->record('catalog.created', $model, ['kind' => $kind, 'name' => $model->getAttribute('name')]);

        return back()->with('success', __('netkeep.catalog.created'));
    }

    public function destroy(string $kind, int $id, AuditLogger $audit): RedirectResponse
    {
        $model = $this->resolve($kind, $id);
        $name = $model->getAttribute('name');
        $model->delete();
        $audit->record('catalog.deleted', metadata: ['kind' => $kind, 'name' => $name]);

        return back()->with('success', __('netkeep.catalog.deleted'));
    }

    private function resolve(string $kind, int $id): Model
    {
        return match ($kind) {
            'site' => Site::query()->findOrFail($id),
            'group' => DeviceGroup::query()->findOrFail($id),
            'tag' => Tag::query()->findOrFail($id),
            'manufacturer' => Manufacturer::query()->findOrFail($id),
            'hardware_model' => HardwareModel::query()->findOrFail($id),
            default => abort(404),
        };
    }
}
