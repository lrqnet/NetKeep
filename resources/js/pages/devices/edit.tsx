import { Form, Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Save,
    ShieldCheck,
    ShieldX,
} from 'lucide-react';
import { useId, useState } from 'react';
import { DeviceCollectionHistory } from '@/components/device-collection-history';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n';

type Option = { id: number; name: string };
type DeviceTab = 'configuration' | 'collections';
type Device = {
    id: number;
    name: string;
    hostname: string | null;
    ip_address: string;
    port: number;
    transport: string;
    manufacturer: string | null;
    hardware_model: string | null;
    oxidized_model: string;
    site_id: number | null;
    device_group_id: number | null;
    credential_profile_id: number | null;
    username_override: string | null;
    backup_interval: number;
    timeout: number;
    enabled: boolean;
    remove_secrets: boolean | null;
    tags: string[];
    has_password_override: boolean;
    has_enable_secret_override: boolean;
    approval_status: string;
    approved_at: string | null;
    ssh_host_key_fingerprint: string | null;
};

export default function EditDevice({
    device,
    options,
    canManage,
    canApprove,
    initialTab,
}: {
    device: Device;
    options: {
        groups: Option[];
        sites: Option[];
        credentials: Option[];
        tags: Option[];
        manufacturers: Option[];
        hardwareModels: Option[];
        oxidizedModels: string[];
        telnetEnabled: boolean;
    };
    canManage: boolean;
    canApprove: boolean;
    initialTab: DeviceTab;
}) {
    const { t } = useI18n();
    const [interval, setIntervalValue] = useState(device.backup_interval);
    const [timeout, setTimeoutValue] = useState(device.timeout);
    const [activeTab, setActiveTab] = useState<DeviceTab>(initialTab);
    const intervalRisk =
        interval < 900 ? 'critical' : interval < 3600 ? 'warning' : 'normal';
    const timeoutRisk =
        timeout > 180 ? 'critical' : timeout > 60 ? 'warning' : 'normal';
    const selectTab = (tab: DeviceTab): void => {
        setActiveTab(tab);
        const url = new URL(window.location.href);

        if (tab === 'collections') {
            url.searchParams.set('tab', tab);
        } else {
            url.searchParams.delete('tab');
        }

        window.history.replaceState(window.history.state, '', url);
    };
    const navigateTabs = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) {
            return;
        }

        event.preventDefault();
        const next =
            activeTab === 'configuration' ? 'collections' : 'configuration';
        selectTab(next);
        requestAnimationFrame(() =>
            document.getElementById(`device-${next}-tab`)?.focus(),
        );
    };

    return (
        <>
            <Head title={t('devices.edit_title', { name: device.name })} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('devices.inventory')}
                    title={t('devices.edit_title', { name: device.name })}
                    description={t('devices.edit_description')}
                    actions={
                        <Button variant="outline" asChild>
                            <Link href="/devices">
                                <ArrowLeft /> {t('devices.back')}
                            </Link>
                        </Button>
                    }
                />
                <div
                    className="mx-auto flex w-full max-w-6xl gap-2 border-b"
                    role="tablist"
                    aria-label={t('devices.sections')}
                    onKeyDown={navigateTabs}
                >
                    <Button
                        id="device-configuration-tab"
                        variant="ghost"
                        role="tab"
                        aria-controls="device-configuration-panel"
                        aria-selected={activeTab === 'configuration'}
                        tabIndex={activeTab === 'configuration' ? 0 : -1}
                        className={
                            activeTab === 'configuration'
                                ? 'border-b-2 border-primary'
                                : ''
                        }
                        onClick={() => selectTab('configuration')}
                    >
                        {t('devices.configuration_tab')}
                    </Button>
                    <Button
                        id="device-collections-tab"
                        variant="ghost"
                        role="tab"
                        aria-controls="device-collections-panel"
                        aria-selected={activeTab === 'collections'}
                        tabIndex={activeTab === 'collections' ? 0 : -1}
                        className={
                            activeTab === 'collections'
                                ? 'border-b-2 border-primary'
                                : ''
                        }
                        onClick={() => selectTab('collections')}
                    >
                        {t('devices.collections_tab')}
                    </Button>
                </div>
                {activeTab === 'configuration' ? (
                    <div
                        id="device-configuration-panel"
                        role="tabpanel"
                        aria-labelledby="device-configuration-tab"
                        className="space-y-6"
                    >
                        <Card className="mx-auto w-full max-w-4xl border-red-500/50 bg-red-500/5">
                            <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-300">
                                        <AlertTriangle className="size-4" />
                                        {t('devices.collection_risk_title')}
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        {t(
                                            'devices.collection_risk_description',
                                        )}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge variant="outline">
                                            {t('devices.backup_interval')}:{' '}
                                            {t(
                                                `risk.${intervalRisk}` as Parameters<
                                                    typeof t
                                                >[0],
                                            )}
                                        </Badge>
                                        <Badge variant="outline">
                                            {t('devices.timeout')}:{' '}
                                            {t(
                                                `risk.${timeoutRisk}` as Parameters<
                                                    typeof t
                                                >[0],
                                            )}
                                        </Badge>
                                        <Badge variant="outline">
                                            {t(
                                                `approval.${device.approval_status}` as Parameters<
                                                    typeof t
                                                >[0],
                                            )}
                                        </Badge>
                                    </div>
                                    {device.ssh_host_key_fingerprint && (
                                        <p className="mt-3 font-mono text-xs break-all text-muted-foreground">
                                            SSH{' '}
                                            {device.ssh_host_key_fingerprint}
                                        </p>
                                    )}
                                </div>
                                {canApprove && (
                                    <Form
                                        action={
                                            device.approval_status ===
                                            'approved'
                                                ? `/devices/${device.id}/revoke-approval`
                                                : `/devices/${device.id}/approve`
                                        }
                                        method="post"
                                    >
                                        {({ processing }) => (
                                            <Button
                                                variant={
                                                    device.approval_status ===
                                                    'approved'
                                                        ? 'outline'
                                                        : 'destructive'
                                                }
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <Spinner />
                                                ) : device.approval_status ===
                                                  'approved' ? (
                                                    <ShieldX />
                                                ) : (
                                                    <ShieldCheck />
                                                )}
                                                {device.approval_status ===
                                                'approved'
                                                    ? t(
                                                          'devices.revoke_approval',
                                                      )
                                                    : t('devices.approve')}
                                            </Button>
                                        )}
                                    </Form>
                                )}
                            </CardContent>
                        </Card>
                        {!canManage ? (
                            <Card>
                                <CardContent className="py-8 text-sm text-muted-foreground">
                                    {t('devices.forbidden')}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="mx-auto w-full max-w-4xl">
                                <CardHeader>
                                    <CardTitle>{t('devices.data')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Form
                                        action={`/devices/${device.id}`}
                                        method="put"
                                        className="grid gap-5 md:grid-cols-2"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <Field
                                                    label={t('common.name')}
                                                    name="name"
                                                    defaultValue={device.name}
                                                    error={errors.name}
                                                    required
                                                />
                                                <Field
                                                    label={t(
                                                        'devices.hostname',
                                                    )}
                                                    name="hostname"
                                                    defaultValue={
                                                        device.hostname ?? ''
                                                    }
                                                    error={errors.hostname}
                                                />
                                                <Field
                                                    label={t(
                                                        'devices.ip_address',
                                                    )}
                                                    name="ip_address"
                                                    defaultValue={
                                                        device.ip_address
                                                    }
                                                    error={errors.ip_address}
                                                    required
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Field
                                                        label={t(
                                                            'devices.port',
                                                        )}
                                                        name="port"
                                                        type="number"
                                                        defaultValue={
                                                            device.port
                                                        }
                                                        error={errors.port}
                                                        required
                                                    />
                                                    <Select
                                                        label={t(
                                                            'devices.transport',
                                                        )}
                                                        name="transport"
                                                        value={device.transport}
                                                        options={[
                                                            ['ssh', 'SSH'],
                                                            ...(options.telnetEnabled ||
                                                            device.transport ===
                                                                'telnet'
                                                                ? [
                                                                      [
                                                                          'telnet',
                                                                          'Telnet',
                                                                      ],
                                                                  ]
                                                                : []),
                                                        ]}
                                                    />
                                                </div>
                                                <Field
                                                    label={t(
                                                        'devices.manufacturer',
                                                    )}
                                                    name="manufacturer"
                                                    list="edit-manufacturers"
                                                    defaultValue={
                                                        device.manufacturer ??
                                                        ''
                                                    }
                                                />
                                                <datalist id="edit-manufacturers">
                                                    {options.manufacturers.map(
                                                        (manufacturer) => (
                                                            <option
                                                                key={
                                                                    manufacturer.id
                                                                }
                                                                value={
                                                                    manufacturer.name
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </datalist>
                                                <Field
                                                    label={t(
                                                        'devices.hardware_model',
                                                    )}
                                                    name="hardware_model"
                                                    list="edit-models"
                                                    defaultValue={
                                                        device.hardware_model ??
                                                        ''
                                                    }
                                                />
                                                <datalist id="edit-models">
                                                    {options.hardwareModels.map(
                                                        (model) => (
                                                            <option
                                                                key={model.id}
                                                                value={
                                                                    model.name
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </datalist>
                                                <Field
                                                    label={t(
                                                        'devices.oxidized_driver',
                                                    )}
                                                    name="oxidized_model"
                                                    defaultValue={
                                                        device.oxidized_model
                                                    }
                                                    list="edit-oxidized-models"
                                                    error={
                                                        errors.oxidized_model
                                                    }
                                                    required
                                                />
                                                <datalist id="edit-oxidized-models">
                                                    {options.oxidizedModels.map(
                                                        (model) => (
                                                            <option
                                                                key={model}
                                                                value={model}
                                                            />
                                                        ),
                                                    )}
                                                </datalist>
                                                <Select
                                                    label={t(
                                                        'devices.credential_profile',
                                                    )}
                                                    name="credential_profile_id"
                                                    value={
                                                        device.credential_profile_id
                                                            ? String(
                                                                  device.credential_profile_id,
                                                              )
                                                            : ''
                                                    }
                                                    empty={t(
                                                        'devices.no_profile',
                                                    )}
                                                    options={options.credentials.map(
                                                        (item) => [
                                                            String(item.id),
                                                            item.name,
                                                        ],
                                                    )}
                                                />
                                                <Select
                                                    label={t('devices.group')}
                                                    name="device_group_id"
                                                    value={
                                                        device.device_group_id
                                                            ? String(
                                                                  device.device_group_id,
                                                              )
                                                            : ''
                                                    }
                                                    empty="default"
                                                    options={options.groups.map(
                                                        (item) => [
                                                            String(item.id),
                                                            item.name,
                                                        ],
                                                    )}
                                                />
                                                <Select
                                                    label={t('devices.site')}
                                                    name="site_id"
                                                    value={
                                                        device.site_id
                                                            ? String(
                                                                  device.site_id,
                                                              )
                                                            : ''
                                                    }
                                                    empty={t('devices.no_site')}
                                                    options={options.sites.map(
                                                        (item) => [
                                                            String(item.id),
                                                            item.name,
                                                        ],
                                                    )}
                                                />
                                                <Field
                                                    label={t(
                                                        'devices.specific_username',
                                                    )}
                                                    name="username_override"
                                                    defaultValue={
                                                        device.username_override ??
                                                        ''
                                                    }
                                                />
                                                <Field
                                                    label={
                                                        device.has_password_override
                                                            ? t(
                                                                  'devices.new_specific_password',
                                                              )
                                                            : t(
                                                                  'devices.specific_password',
                                                              )
                                                    }
                                                    name="password_override"
                                                    type="password"
                                                    autoComplete="new-password"
                                                />
                                                <Field
                                                    label={
                                                        device.has_enable_secret_override
                                                            ? t(
                                                                  'devices.new_specific_enable',
                                                              )
                                                            : t(
                                                                  'devices.specific_enable',
                                                              )
                                                    }
                                                    name="enable_secret_override"
                                                    type="password"
                                                    autoComplete="new-password"
                                                />
                                                <Field
                                                    label={t(
                                                        'devices.backup_interval',
                                                    )}
                                                    name="backup_interval"
                                                    type="number"
                                                    min="300"
                                                    defaultValue={
                                                        device.backup_interval
                                                    }
                                                    onChange={(event) =>
                                                        setIntervalValue(
                                                            Number(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        )
                                                    }
                                                    required
                                                />
                                                <Field
                                                    label={t('devices.timeout')}
                                                    name="timeout"
                                                    type="number"
                                                    min="5"
                                                    defaultValue={
                                                        device.timeout
                                                    }
                                                    onChange={(event) =>
                                                        setTimeoutValue(
                                                            Number(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        )
                                                    }
                                                    required
                                                />
                                                <Field
                                                    label={t(
                                                        'devices.comma_tags',
                                                    )}
                                                    name="tag_list"
                                                    defaultValue={device.tags.join(
                                                        ', ',
                                                    )}
                                                />
                                                <div className="space-y-3 rounded-md border p-4 md:col-span-2">
                                                    <input
                                                        type="hidden"
                                                        name="enabled"
                                                        value="0"
                                                    />
                                                    <p className="text-sm text-muted-foreground">
                                                        {t(
                                                            'devices.activation_by_approval',
                                                        )}
                                                    </p>
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="hidden"
                                                            name="remove_secrets"
                                                            value="0"
                                                        />
                                                        <input
                                                            type="checkbox"
                                                            name="remove_secrets"
                                                            value="1"
                                                            defaultChecked={
                                                                device.remove_secrets ===
                                                                true
                                                            }
                                                        />
                                                        {t(
                                                            'devices.remove_secrets',
                                                        )}
                                                    </label>
                                                </div>
                                                <Button
                                                    className="md:col-span-2"
                                                    disabled={processing}
                                                >
                                                    {processing ? (
                                                        <Spinner />
                                                    ) : (
                                                        <Save />
                                                    )}
                                                    {t('devices.save')}
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                ) : (
                    <div
                        id="device-collections-panel"
                        role="tabpanel"
                        aria-labelledby="device-collections-tab"
                    >
                        <DeviceCollectionHistory
                            deviceId={device.id}
                            canDiagnose={canApprove}
                        />
                    </div>
                )}
            </div>
        </>
    );
}

function Field({
    label,
    error,
    ...props
}: React.ComponentProps<typeof Input> & {
    label: string;
    error?: string;
}) {
    const generatedId = useId();
    const id = props.id ?? `device-field-${generatedId}`;
    const errorId = error ? `${id}-error` : undefined;

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input
                {...props}
                id={id}
                aria-describedby={errorId ?? props['aria-describedby']}
                aria-invalid={error ? true : props['aria-invalid']}
            />
            {error && (
                <p id={errorId} className="text-xs text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}

function Select({
    label,
    name,
    value,
    options,
    empty,
}: {
    label: string;
    name: string;
    value?: string;
    options: string[][];
    empty?: string;
}) {
    const id = useId();

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <select
                id={id}
                name={name}
                defaultValue={value}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
                {empty && <option value="">{empty}</option>}
                {options.map(([optionValue, text]) => (
                    <option key={optionValue} value={optionValue}>
                        {text}
                    </option>
                ))}
            </select>
        </div>
    );
}
