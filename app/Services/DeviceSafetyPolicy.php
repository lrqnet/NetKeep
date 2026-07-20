<?php

namespace App\Services;

use App\Enums\DangerousFeature;
use App\Models\CustomModel;
use App\Models\Device;

class DeviceSafetyPolicy
{
    /** @var array<string, CustomModel>|null */
    private ?array $customModels = null;

    public function __construct(private DangerousFeatureService $dangerous) {}

    public function allows(Device $device): bool
    {
        if (
            $device->transport === 'telnet'
            && ! $this->dangerous->enabled(DangerousFeature::Telnet)
        ) {
            return false;
        }

        $customModel = $device->custom_model_id
            ? $device->customModel
            : $this->customModels()[$device->oxidized_model] ?? null;

        if ($customModel) {
            return $customModel->status === 'published'
                && (
                    $customModel->source !== 'raw'
                    || $this->dangerous->enabled(DangerousFeature::RawRuby)
                );
        }

        return in_array(
            $device->oxidized_model,
            config('oxidized-security.reviewed_drivers', []),
            true,
        ) || $this->dangerous->enabled(DangerousFeature::UnreviewedDrivers);
    }

    /** @return array<string, CustomModel> */
    private function customModels(): array
    {
        $this->customModels ??= CustomModel::query()
            ->get()
            ->keyBy('slug')
            ->all();

        return $this->customModels;
    }
}
