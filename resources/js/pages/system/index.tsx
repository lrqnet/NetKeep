import { Form, Head, router, usePage } from '@inertiajs/react';
import {
    Building2,
    Clock3,
    Globe2,
    HardDrive,
    Save,
    ShieldAlert,
    TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n';

type Organization = {
    name: string;
    locale: string;
    timezone: string;
    domain: string | null;
    canonical_url: string | null;
    logo_path: string | null;
    settings: {
        default_backup_interval?: number;
        default_timeout?: number;
        full_backup_retention_days?: number;
        collection_concurrency?: number;
    } | null;
};

export default function SystemSettings({
    organization,
    timezones,
    collectionCapacity,
    dangerousFeatures,
}: {
    organization: Organization;
    timezones: string[];
    collectionCapacity: {
        deviceCount: number;
        shortestInterval: number | null;
    };
    dangerousFeatures: Record<string, boolean>;
}) {
    const { t } = useI18n();
    const { auth } = usePage().props;
    const [interval, setIntervalValue] = useState(
        organization.settings?.default_backup_interval ?? 3600,
    );
    const [timeout, setTimeoutValue] = useState(
        organization.settings?.default_timeout ?? 20,
    );
    const [concurrency, setConcurrency] = useState(
        organization.settings?.collection_concurrency ?? 5,
    );
    const intervalRisk =
        interval < 900 ? 'critical' : interval < 3600 ? 'warning' : 'normal';
    const timeoutRisk =
        timeout > 180 ? 'critical' : timeout > 60 ? 'warning' : 'normal';
    const concurrencyRisk =
        concurrency > 10 ? 'critical' : concurrency > 5 ? 'warning' : 'normal';
    const capacityInterval = collectionCapacity.shortestInterval ?? interval;
    const estimatedCycle =
        collectionCapacity.deviceCount === 0
            ? 0
            : Math.ceil(collectionCapacity.deviceCount / concurrency) * timeout;
    const capacityFits = estimatedCycle <= capacityInterval;

    return (
        <>
            <Head title={t('system.title')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('common.administration')}
                    title={t('system.heading')}
                    description={t('system.description')}
                />
                <Card className="border-red-500/50 bg-red-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-300">
                            <ShieldAlert className="size-5" />
                            {t('system.collection_security')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-6">
                        <p>{t('system.collection_security_description')}</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <RiskItem
                                label={t('system.default_interval')}
                                level={intervalRisk}
                                t={t}
                            />
                            <RiskItem
                                label={t('system.default_timeout')}
                                level={timeoutRisk}
                                t={t}
                            />
                            <RiskItem
                                label={t('system.collection_concurrency')}
                                level={concurrencyRisk}
                                t={t}
                            />
                        </div>
                        <div
                            className={`rounded-lg border p-3 ${
                                capacityFits
                                    ? 'border-emerald-500/30 bg-emerald-500/10'
                                    : 'border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200'
                            }`}
                        >
                            <p className="font-medium">
                                {capacityFits
                                    ? t('system.capacity_fits')
                                    : t('system.capacity_insufficient')}
                            </p>
                            <p className="mt-1 text-xs">
                                {t('system.capacity_estimate', {
                                    devices: collectionCapacity.deviceCount,
                                    cycle: estimatedCycle,
                                    interval: capacityInterval,
                                })}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Form
                    action="/system"
                    method="put"
                    encType="multipart/form-data"
                    options={{ preserveScroll: true }}
                    className="grid items-start gap-6 xl:grid-cols-2"
                >
                    {({ processing, errors }) => (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Building2 className="size-4 text-emerald-600" />
                                        {t('system.organization_access')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Field
                                        label={t('common.name')}
                                        name="name"
                                        defaultValue={organization.name}
                                        error={errors.name}
                                        required
                                    />
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Select
                                            label={t('system.default_language')}
                                            name="locale"
                                            defaultValue={organization.locale}
                                            options={[
                                                ['pt_BR', 'Português'],
                                                ['en', 'English'],
                                                ['es', 'Español'],
                                            ]}
                                        />
                                        <div className="space-y-1.5">
                                            <Label htmlFor="timezone">
                                                {t('system.timezone')}
                                            </Label>
                                            <select
                                                id="timezone"
                                                name="timezone"
                                                defaultValue={
                                                    organization.timezone
                                                }
                                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                            >
                                                {timezones.map((timezone) => (
                                                    <option
                                                        key={timezone}
                                                        value={timezone}
                                                    >
                                                        {timezone}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <Field
                                        label={t('system.https_domain')}
                                        name="domain"
                                        defaultValue={organization.domain ?? ''}
                                        placeholder="netkeep.exemplo.com"
                                        error={errors.domain}
                                    />
                                    <Field
                                        label={t('system.canonical_url')}
                                        name="canonical_url"
                                        type="url"
                                        defaultValue={
                                            organization.canonical_url ?? ''
                                        }
                                        placeholder="https://netkeep.example.com"
                                        error={errors.canonical_url}
                                    />
                                    <p className="flex gap-2 text-xs leading-5 text-muted-foreground">
                                        <Globe2 className="mt-0.5 size-4 shrink-0" />
                                        {t('system.domain_hint')}
                                    </p>
                                    <Field
                                        label={t('system.new_logo')}
                                        name="logo"
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        error={errors.logo}
                                    />
                                    {organization.logo_path && (
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="hidden"
                                                name="remove_logo"
                                                value="0"
                                            />
                                            <input
                                                type="checkbox"
                                                name="remove_logo"
                                                value="1"
                                            />
                                            {t('system.remove_logo')}
                                        </label>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Clock3 className="size-4 text-emerald-600" />
                                        {t('system.defaults_retention')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Field
                                        label={t('system.default_interval')}
                                        name="default_backup_interval"
                                        type="number"
                                        min={300}
                                        max={604800}
                                        defaultValue={interval}
                                        onChange={(event) =>
                                            setIntervalValue(
                                                Number(event.target.value),
                                            )
                                        }
                                        required
                                    />
                                    <Field
                                        label={t('system.default_timeout')}
                                        name="default_timeout"
                                        type="number"
                                        min={5}
                                        max={300}
                                        defaultValue={timeout}
                                        onChange={(event) =>
                                            setTimeoutValue(
                                                Number(event.target.value),
                                            )
                                        }
                                        required
                                    />
                                    <Field
                                        label={t(
                                            'system.collection_concurrency',
                                        )}
                                        name="collection_concurrency"
                                        type="number"
                                        min={1}
                                        max={20}
                                        defaultValue={concurrency}
                                        onChange={(event) =>
                                            setConcurrency(
                                                Number(event.target.value),
                                            )
                                        }
                                        required
                                    />
                                    {concurrency > 10 && (
                                        <Field
                                            label={t(
                                                'system.high_concurrency_confirmation',
                                            )}
                                            name="high_concurrency_confirmation"
                                            required
                                            placeholder="HIGH CONCURRENCY"
                                            error={
                                                errors.high_concurrency_confirmation
                                            }
                                        />
                                    )}
                                    <Field
                                        label={t('system.retention_days')}
                                        name="full_backup_retention_days"
                                        type="number"
                                        min={0}
                                        max={3650}
                                        defaultValue={
                                            organization.settings
                                                ?.full_backup_retention_days ??
                                            0
                                        }
                                        required
                                    />
                                    <p className="flex gap-2 rounded-lg border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                                        <HardDrive className="mt-0.5 size-4 shrink-0" />
                                        {t('system.retention_hint')}
                                    </p>
                                    <Button
                                        className="w-full"
                                        disabled={processing}
                                    >
                                        {processing ? <Spinner /> : <Save />}
                                        {t('system.save')}
                                    </Button>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </Form>
                {auth.user.role === 'owner' && (
                    <Card className="border-red-500/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-300">
                                <TriangleAlert className="size-5" />
                                {t('system.dangerous_features')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm leading-6 text-muted-foreground">
                                {t('system.dangerous_features_description')}
                            </p>
                            <div className="grid gap-3 md:grid-cols-2">
                                {Object.entries(dangerousFeatures).map(
                                    ([feature, enabled]) => (
                                        <div
                                            key={feature}
                                            className="flex items-center justify-between gap-4 rounded-lg border p-4"
                                        >
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {t(
                                                        `system.dangerous.${feature}` as Parameters<
                                                            typeof t
                                                        >[0],
                                                    )}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {enabled
                                                        ? t(
                                                              'system.dangerous_enabled',
                                                          )
                                                        : t(
                                                              'system.safe_disabled',
                                                          )}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant={
                                                    enabled
                                                        ? 'outline'
                                                        : 'destructive'
                                                }
                                                size="sm"
                                                onClick={() => {
                                                    const confirmation = enabled
                                                        ? ''
                                                        : window.prompt(
                                                              t(
                                                                  'system.dangerous_confirmation',
                                                                  { feature },
                                                              ),
                                                          );

                                                    if (
                                                        !enabled &&
                                                        confirmation !==
                                                            `ENABLE ${feature}`
                                                    ) {
                                                        return;
                                                    }

                                                    router.patch(
                                                        `/system/dangerous-features/${feature}`,
                                                        {
                                                            enabled: !enabled,
                                                            confirmation,
                                                        },
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    );
                                                }}
                                            >
                                                {enabled
                                                    ? t('common.disable')
                                                    : t('common.enable')}
                                            </Button>
                                        </div>
                                    ),
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

function RiskItem({
    label,
    level,
    t,
}: {
    label: string;
    level: string;
    t: ReturnType<typeof useI18n>['t'];
}) {
    const styles = {
        normal: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        warning:
            'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        critical:
            'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    } as const;

    return (
        <div
            className={`rounded-lg border p-3 ${styles[level as keyof typeof styles]}`}
        >
            <p className="text-xs">{label}</p>
            <p className="mt-1 font-semibold">
                {t(`risk.${level}` as Parameters<typeof t>[0])}
            </p>
        </div>
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
    defaultValue,
    options,
}: {
    label: string;
    name: string;
    defaultValue: string;
    options: string[][];
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={name}>{label}</Label>
            <select
                id={name}
                name={name}
                defaultValue={defaultValue}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
                {options.map(([value, text]) => (
                    <option key={value} value={value}>
                        {text}
                    </option>
                ))}
            </select>
        </div>
    );
}
