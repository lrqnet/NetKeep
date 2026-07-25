import { Form, Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Download,
    Edit3,
    FileUp,
    Play,
    Plus,
    Router,
    Search,
    ShieldCheck,
    ShieldX,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/i18n';

type Option = { id: number; name: string; username?: string | null };
type Device = {
    id: number;
    name: string;
    hostname: string | null;
    ip_address: string;
    port: number;
    transport: string;
    oxidized_model: string;
    status: string;
    enabled: boolean;
    approval_status: string;
    last_backup_at: string | null;
    next_collection_at: string | null;
    manual_cooldown_until: string | null;
    group?: Option;
    site?: Option;
    credentials?: Option;
    tags: Option[];
};
type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

const statusStyles: Record<string, string> = {
    healthy: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    failing: 'bg-red-500/10 text-red-700 dark:text-red-300',
    conflict: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    disabled: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
};

const statusKeys = {
    healthy: 'status.healthy',
    failing: 'status.failing',
    conflict: 'status.conflict',
    pending: 'status.pending',
    disabled: 'status.disabled',
} as const;

export default function DevicesIndex({
    devices,
    filters,
    options,
    canManage,
    canApprove,
}: {
    devices: Paginator<Device>;
    filters: { search: string };
    options: {
        groups: Option[];
        sites: Option[];
        credentials: Option[];
        tags: Option[];
        manufacturers: Option[];
        hardwareModels: Array<
            Option & {
                oxidized_model?: string | null;
                manufacturer?: Option | null;
            }
        >;
        defaults: { backup_interval: number; timeout: number };
        oxidizedModels: string[];
        oxidizedVersion: string;
        telnetEnabled: boolean;
    };
    canManage: boolean;
    canApprove: boolean;
}) {
    const { t, formatNumber, formatDateTime } = useI18n();
    const [collectionDevice, setCollectionDevice] = useState<Device | null>(
        null,
    );

    return (
        <>
            <Head title={t('devices.title')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('devices.inventory')}
                    title={t('devices.title')}
                    description={t('devices.count_description', {
                        total: formatNumber(devices.total),
                    })}
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <a href="/devices/export">
                                    <Download /> {t('devices.export_csv')}
                                </a>
                            </Button>
                            {canManage && (
                                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium shadow-xs hover:bg-accent">
                                    <FileUp className="size-4" />
                                    {t('devices.import_csv')}
                                    <input
                                        className="sr-only"
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={(event) => {
                                            const file =
                                                event.currentTarget.files?.[0];

                                            if (!file) {
                                                return;
                                            }

                                            router.post(
                                                '/devices/import',
                                                { file },
                                                {
                                                    forceFormData: true,
                                                    preserveScroll: true,
                                                },
                                            );
                                        }}
                                    />
                                </label>
                            )}
                        </>
                    }
                />

                <div
                    className={`grid items-start gap-6 ${canManage ? 'xl:grid-cols-[1fr_360px]' : ''}`}
                >
                    <Card className="gap-0 overflow-hidden py-0">
                        <CardHeader className="border-b py-4">
                            <form
                                className="relative max-w-md"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const form = new FormData(
                                        event.currentTarget,
                                    );
                                    router.get(
                                        '/devices',
                                        { search: form.get('search') },
                                        { preserveState: true },
                                    );
                                }}
                            >
                                <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                <Input
                                    name="search"
                                    defaultValue={filters.search}
                                    className="pl-9"
                                    placeholder={t(
                                        'devices.search_placeholder',
                                    )}
                                />
                            </form>
                        </CardHeader>
                        <CardContent className="px-0">
                            {devices.data.length === 0 ? (
                                <div className="px-6 py-16 text-center">
                                    <Router className="mx-auto size-9 text-muted-foreground" />
                                    <h2 className="mt-4 font-medium">
                                        {t('devices.empty')}
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {t('devices.empty_hint')}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/40 text-left text-xs text-muted-foreground uppercase">
                                            <tr>
                                                <th className="px-5 py-3 font-medium">
                                                    {t('devices.device')}
                                                </th>
                                                <th className="px-5 py-3 font-medium">
                                                    {t('devices.model')}
                                                </th>
                                                <th className="px-5 py-3 font-medium">
                                                    {t('devices.group_site')}
                                                </th>
                                                <th className="px-5 py-3 font-medium">
                                                    {t('devices.state')}
                                                </th>
                                                <th className="px-5 py-3 text-right font-medium">
                                                    {t('common.actions')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {devices.data.map((device) => (
                                                <tr
                                                    key={device.id}
                                                    className="hover:bg-muted/30"
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium">
                                                            {device.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {device.ip_address}:
                                                            {device.port} ·{' '}
                                                            {device.transport}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4 font-mono text-xs">
                                                        {device.oxidized_model}
                                                    </td>
                                                    <td className="px-5 py-4 text-muted-foreground">
                                                        {device.group?.name ??
                                                            'default'}{' '}
                                                        ·{' '}
                                                        {device.site?.name ??
                                                            '—'}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                statusStyles[
                                                                    device
                                                                        .status
                                                                ]
                                                            }
                                                        >
                                                            {t(
                                                                statusKeys[
                                                                    device.status as keyof typeof statusKeys
                                                                ] ??
                                                                    'status.pending',
                                                            )}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className="ml-2"
                                                        >
                                                            {t(
                                                                `approval.${device.approval_status}` as Parameters<
                                                                    typeof t
                                                                >[0],
                                                            )}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                asChild
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <Link
                                                                    href={`/devices/${device.id}/configuration`}
                                                                >
                                                                    {t(
                                                                        'devices.configurations',
                                                                    )}
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                asChild
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <Link
                                                                    href={`/devices/${device.id}/edit?tab=collections`}
                                                                >
                                                                    {t(
                                                                        'devices.collections_tab',
                                                                    )}
                                                                </Link>
                                                            </Button>
                                                            {canManage && (
                                                                <Button
                                                                    asChild
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title={t(
                                                                        'common.edit',
                                                                    )}
                                                                >
                                                                    <Link
                                                                        href={`/devices/${device.id}/edit`}
                                                                    >
                                                                        <Edit3 />
                                                                    </Link>
                                                                </Button>
                                                            )}
                                                            {canManage && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title={t(
                                                                        'devices.collect_now',
                                                                    )}
                                                                    disabled={
                                                                        !device.enabled ||
                                                                        device.approval_status !==
                                                                            'approved'
                                                                    }
                                                                    onClick={() =>
                                                                        setCollectionDevice(
                                                                            device,
                                                                        )
                                                                    }
                                                                >
                                                                    <Play />
                                                                </Button>
                                                            )}
                                                            {canApprove &&
                                                                device.approval_status !==
                                                                    'approved' && (
                                                                    <Form
                                                                        action={`/devices/${device.id}/approve`}
                                                                        method="post"
                                                                    >
                                                                        {({
                                                                            processing,
                                                                        }) => (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                title={t(
                                                                                    'devices.approve',
                                                                                )}
                                                                                disabled={
                                                                                    processing
                                                                                }
                                                                            >
                                                                                {processing ? (
                                                                                    <Spinner />
                                                                                ) : (
                                                                                    <ShieldCheck />
                                                                                )}
                                                                            </Button>
                                                                        )}
                                                                    </Form>
                                                                )}
                                                            {canApprove &&
                                                                device.approval_status ===
                                                                    'approved' && (
                                                                    <Form
                                                                        action={`/devices/${device.id}/revoke-approval`}
                                                                        method="post"
                                                                    >
                                                                        {({
                                                                            processing,
                                                                        }) => (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                title={t(
                                                                                    'devices.revoke_approval',
                                                                                )}
                                                                                disabled={
                                                                                    processing
                                                                                }
                                                                            >
                                                                                {processing ? (
                                                                                    <Spinner />
                                                                                ) : (
                                                                                    <ShieldX />
                                                                                )}
                                                                            </Button>
                                                                        )}
                                                                    </Form>
                                                                )}
                                                            {canManage && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title={t(
                                                                        'devices.disable',
                                                                    )}
                                                                    onClick={() => {
                                                                        if (
                                                                            confirm(
                                                                                t(
                                                                                    'devices.disable_confirm',
                                                                                    {
                                                                                        name: device.name,
                                                                                    },
                                                                                ),
                                                                            )
                                                                        ) {
                                                                            router.delete(
                                                                                `/devices/${device.id}`,
                                                                                {
                                                                                    preserveScroll: true,
                                                                                },
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {devices.last_page > 1 && (
                                <div className="flex items-center justify-between border-t px-5 py-4 text-sm">
                                    <span className="text-muted-foreground">
                                        {t('common.page_of', {
                                            current: devices.current_page,
                                            total: devices.last_page,
                                        })}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            disabled={!devices.prev_page_url}
                                        >
                                            <Link
                                                href={
                                                    devices.prev_page_url ?? '#'
                                                }
                                            >
                                                {t('common.previous')}
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            disabled={!devices.next_page_url}
                                        >
                                            <Link
                                                href={
                                                    devices.next_page_url ?? '#'
                                                }
                                            >
                                                {t('common.next')}
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {canManage && (
                        <Card className="sticky top-4 gap-4 py-5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Plus className="size-4 text-emerald-600" />
                                    {t('devices.new')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Form
                                    action="/devices"
                                    method="post"
                                    resetOnSuccess
                                    options={{ preserveScroll: true }}
                                    className="space-y-4"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <Field
                                                label={t('common.name')}
                                                name="name"
                                                required
                                                error={errors.name}
                                            />
                                            <Field
                                                label={t('devices.ip_address')}
                                                name="ip_address"
                                                placeholder="192.0.2.10"
                                                required
                                                error={errors.ip_address}
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field
                                                    label={t('devices.port')}
                                                    name="port"
                                                    type="number"
                                                    defaultValue="22"
                                                    required
                                                    error={errors.port}
                                                />
                                                <Select
                                                    label={t(
                                                        'devices.transport',
                                                    )}
                                                    name="transport"
                                                    options={[
                                                        {
                                                            id: 'ssh',
                                                            name: 'SSH',
                                                        },
                                                        ...(options.telnetEnabled
                                                            ? [
                                                                  {
                                                                      id: 'telnet',
                                                                      name: 'Telnet',
                                                                  },
                                                              ]
                                                            : []),
                                                    ]}
                                                />
                                            </div>
                                            <Field
                                                label={t(
                                                    'devices.oxidized_driver',
                                                )}
                                                name="oxidized_model"
                                                placeholder="ios, junos, routeros..."
                                                list="oxidized-model-options"
                                                required
                                                error={errors.oxidized_model}
                                            />
                                            <datalist id="oxidized-model-options">
                                                {options.oxidizedModels.map(
                                                    (model) => (
                                                        <option
                                                            key={model}
                                                            value={model}
                                                        />
                                                    ),
                                                )}
                                            </datalist>
                                            <p className="-mt-2 text-xs text-muted-foreground">
                                                {t('devices.oxidized_catalog', {
                                                    version:
                                                        options.oxidizedVersion,
                                                })}
                                            </p>
                                            <Field
                                                label={t(
                                                    'devices.manufacturer',
                                                )}
                                                name="manufacturer"
                                                list="manufacturer-options"
                                            />
                                            <datalist id="manufacturer-options">
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
                                                list="hardware-model-options"
                                            />
                                            <datalist id="hardware-model-options">
                                                {options.hardwareModels.map(
                                                    (model) => (
                                                        <option
                                                            key={model.id}
                                                            value={model.name}
                                                        >
                                                            {
                                                                model
                                                                    .manufacturer
                                                                    ?.name
                                                            }
                                                        </option>
                                                    ),
                                                )}
                                            </datalist>
                                            <Select
                                                label={t('devices.credential')}
                                                name="credential_profile_id"
                                                options={options.credentials}
                                                empty={t('devices.no_profile')}
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Select
                                                    label={t('devices.group')}
                                                    name="device_group_id"
                                                    options={options.groups}
                                                    empty="default"
                                                />
                                                <Select
                                                    label={t('devices.site')}
                                                    name="site_id"
                                                    options={options.sites}
                                                    empty={t('devices.no_site')}
                                                />
                                            </div>
                                            <Field
                                                label={t('devices.tags')}
                                                name="tags[]"
                                                list="tag-options"
                                                placeholder="core"
                                            />
                                            <datalist id="tag-options">
                                                {options.tags.map((tag) => (
                                                    <option
                                                        key={tag.id}
                                                        value={tag.name}
                                                    />
                                                ))}
                                            </datalist>
                                            <input
                                                type="hidden"
                                                name="backup_interval"
                                                value={
                                                    options.defaults
                                                        .backup_interval
                                                }
                                            />
                                            <input
                                                type="hidden"
                                                name="timeout"
                                                value={options.defaults.timeout}
                                            />
                                            <input
                                                type="hidden"
                                                name="enabled"
                                                value="0"
                                            />
                                            <Button
                                                className="w-full"
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <Spinner />
                                                ) : (
                                                    <Plus />
                                                )}
                                                {t('devices.add')}
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
            <Dialog
                open={collectionDevice !== null}
                onOpenChange={(open) => !open && setCollectionDevice(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('devices.manual_collection_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('devices.manual_collection_description')}
                        </DialogDescription>
                    </DialogHeader>
                    {collectionDevice && (
                        <>
                            <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm">
                                <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-300">
                                    <AlertTriangle className="size-4" />
                                    {t('devices.manual_collection_warning')}
                                </p>
                                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <dt className="text-muted-foreground">
                                            {t('devices.destination')}
                                        </dt>
                                        <dd className="mt-1 font-mono">
                                            {collectionDevice.hostname ??
                                                collectionDevice.ip_address}
                                            :{collectionDevice.port}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">
                                            {t('devices.transport_driver')}
                                        </dt>
                                        <dd className="mt-1">
                                            {collectionDevice.transport} ·{' '}
                                            {collectionDevice.oxidized_model}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">
                                            {t('devices.last_collection')}
                                        </dt>
                                        <dd className="mt-1">
                                            {collectionDevice.last_backup_at
                                                ? formatDateTime(
                                                      collectionDevice.last_backup_at,
                                                  )
                                                : t('common.never')}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">
                                            {t('devices.next_allowed')}
                                        </dt>
                                        <dd className="mt-1">
                                            {collectionDevice.manual_cooldown_until
                                                ? formatDateTime(
                                                      collectionDevice.manual_cooldown_until,
                                                  )
                                                : t('common.now')}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                            <DialogFooter>
                                {canApprove && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            router.post(
                                                `/devices/${collectionDevice.id}/force-collect`,
                                                {
                                                    risk_confirmation: 'FORCE',
                                                },
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () =>
                                                        setCollectionDevice(
                                                            null,
                                                        ),
                                                },
                                            );
                                        }}
                                    >
                                        {t('devices.force_collection')}
                                    </Button>
                                )}
                                <Button
                                    onClick={() => {
                                        router.post(
                                            `/devices/${collectionDevice.id}/collect`,
                                            {},
                                            {
                                                preserveScroll: true,
                                                onSuccess: () =>
                                                    setCollectionDevice(null),
                                            },
                                        );
                                    }}
                                >
                                    <Play />
                                    {t('devices.confirm_collection')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
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
    return (
        <div className="space-y-1.5">
            <Label htmlFor={props.name}>{label}</Label>
            <Input id={props.name} {...props} />
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function Select({
    label,
    name,
    options,
    empty,
}: {
    label: string;
    name: string;
    options: Array<{ id: number | string; name: string }>;
    empty?: string;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={name}>{label}</Label>
            <select
                id={name}
                name={name}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
                {empty && <option value="">{empty}</option>}
                {options.map((option) => (
                    <option value={option.id} key={option.id}>
                        {option.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
