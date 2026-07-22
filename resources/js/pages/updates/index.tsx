import { Form, Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Check,
    Circle,
    Clock3,
    ExternalLink,
    LoaderCircle,
    RefreshCw,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

type Destination = { id: number; name: string; type: string };

type Release = {
    status:
        'never_checked' | 'checking' | 'up_to_date' | 'available' | 'failed';
    current: string;
    candidate: string | null;
    compatibility: 'same_major' | 'major_upgrade' | 'unsupported' | null;
    release_url: string | null;
    published_at: string | null;
    manual_eligible: boolean;
    automatic_eligible: boolean;
    rollback_safe: boolean;
    requires_host_steps: boolean;
    estimated_downtime_seconds: number;
    last_attempt_at: string | null;
    last_success_at: string | null;
    last_error_code: string | null;
};

type OperationStatus =
    | 'queued'
    | 'backing_up'
    | 'validating'
    | 'downloading'
    | 'applying'
    | 'restarting'
    | 'succeeded'
    | 'failed'
    | 'recovery_required';

type Operation = {
    uuid: string;
    trigger: 'manual' | 'automatic';
    status: OperationStatus;
    from_version: string;
    to_version: string;
    compatibility: 'same_major' | 'major_upgrade' | 'unsupported';
    safe_error_code: string | null;
    requested_at: string;
    started_at: string | null;
    completed_at: string | null;
};

type Settings = {
    auto_update: boolean;
    automatic_updates_accepted: boolean;
    destination_id: number | null;
    days: number[];
    window_start: string;
    window_end: string;
    timezone: string;
};

const activeStatuses: OperationStatus[] = [
    'queued',
    'backing_up',
    'validating',
    'downloading',
    'applying',
    'restarting',
];

const operationProgress: Record<OperationStatus, number> = {
    queued: 0,
    backing_up: 0,
    validating: 1,
    downloading: 2,
    applying: 3,
    restarting: 4,
    succeeded: 6,
    failed: -1,
    recovery_required: -1,
};

export default function UpdatesIndex({
    release,
    operation,
    updater,
    settings,
    destinations,
}: {
    release: Release;
    operation: Operation | null;
    updater: { online: boolean; checked_at: string | null };
    settings: Settings;
    destinations: Destination[];
}) {
    const { t, formatDateTime } = useI18n();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [polledOperation, setPolledOperation] = useState<Operation | null>(
        null,
    );
    const [reconnecting, setReconnecting] = useState(false);
    const currentOperation =
        polledOperation?.uuid === operation?.uuid
            ? polledOperation
            : (operation ?? polledOperation);
    const active =
        currentOperation !== null &&
        activeStatuses.includes(currentOperation.status);
    const operationUuid = currentOperation?.uuid;

    useEffect(() => {
        if (release.status !== 'checking') {
            return;
        }

        const interval = window.setInterval(() => {
            router.reload({
                only: ['release', 'operation', 'updater'],
            });
        }, 2500);

        return () => window.clearInterval(interval);
    }, [release.status]);

    useEffect(() => {
        if (!active || !operationUuid) {
            return;
        }

        let cancelled = false;
        const poll = async () => {
            try {
                const response = await fetch(
                    `/updates/operations/${operationUuid}`,
                    {
                        credentials: 'same-origin',
                        headers: { Accept: 'application/json' },
                    },
                );

                if (!response.ok) {
                    throw new Error('operation_unavailable');
                }

                const next = (await response.json()) as Operation;

                if (cancelled) {
                    return;
                }

                setReconnecting(false);
                setPolledOperation(next);

                if (next.status === 'succeeded') {
                    window.setTimeout(() => {
                        window.location.assign('/dashboard');
                    }, 1500);
                }
            } catch {
                if (!cancelled) {
                    setReconnecting(true);
                }
            }
        };
        const interval = window.setInterval(() => void poll(), 2500);
        void poll();

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [active, operationUuid]);

    const state = useMemo(() => {
        if (reconnecting && active) {
            return 'reconnecting';
        }

        if (currentOperation?.status === 'recovery_required') {
            return 'recovery_required';
        }

        if (active) {
            return 'updating';
        }

        if (release.status === 'checking') {
            return 'checking';
        }

        if (release.status === 'failed') {
            return 'unavailable';
        }

        if (release.status === 'available' && release.candidate) {
            return 'available';
        }

        return 'current';
    }, [active, currentOperation?.status, reconnecting, release]);

    return (
        <>
            <Head title={t('updates.title')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('updates.eyebrow')}
                    title={t('updates.title')}
                    description={t('updates.description')}
                />

                {currentOperation &&
                    (active ||
                        currentOperation.status === 'recovery_required' ||
                        currentOperation.status === 'failed') && (
                        <OperationProgress
                            operation={currentOperation}
                            reconnecting={reconnecting}
                        />
                    )}

                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                                {t('updates.state')}
                                <StateBadge state={state} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                                <VersionValue
                                    label={t('updates.current_version')}
                                    value={`v${release.current.replace(/^v/, '')}`}
                                />
                                <VersionValue
                                    label={t('updates.available')}
                                    value={
                                        release.candidate
                                            ? `v${release.candidate.replace(/^v/, '')}`
                                            : t('common.none')
                                    }
                                />
                            </div>

                            {release.last_attempt_at && (
                                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock3 className="size-3.5" />
                                    {t('updates.last_checked', {
                                        date: formatDateTime(
                                            release.last_attempt_at,
                                        ),
                                    })}
                                </p>
                            )}

                            {release.status === 'failed' && (
                                <Alert>
                                    <AlertTriangle />
                                    <AlertTitle>
                                        {t('updates.check_failed_title')}
                                    </AlertTitle>
                                    <AlertDescription>
                                        {t('updates.check_failed_description')}
                                        {release.last_success_at && (
                                            <span>
                                                {' '}
                                                {t(
                                                    'updates.last_success_preserved',
                                                    {
                                                        date: formatDateTime(
                                                            release.last_success_at,
                                                        ),
                                                    },
                                                )}
                                            </span>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {release.candidate && (
                                <div className="space-y-2 rounded-lg border p-4 text-sm">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline">
                                            {release.compatibility ===
                                            'major_upgrade'
                                                ? t('updates.major_release')
                                                : release.compatibility ===
                                                    'unsupported'
                                                  ? t('updates.not_installable')
                                                  : t(
                                                        'updates.compatible_release',
                                                    )}
                                        </Badge>
                                        {release.rollback_safe && (
                                            <Badge variant="outline">
                                                {t(
                                                    'updates.rollback_supported',
                                                )}
                                            </Badge>
                                        )}
                                    </div>
                                    {release.published_at && (
                                        <p className="text-muted-foreground">
                                            {t('updates.released_at', {
                                                date: formatDateTime(
                                                    release.published_at,
                                                ),
                                            })}
                                        </p>
                                    )}
                                    {release.release_url && (
                                        <a
                                            href={release.release_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                                        >
                                            {t('updates.release_notes')}
                                            <ExternalLink className="size-3.5" />
                                        </a>
                                    )}
                                </div>
                            )}

                            {!updater.online && (
                                <Alert variant="destructive">
                                    <AlertTriangle />
                                    <AlertTitle>
                                        {t('updates.updater_offline_title')}
                                    </AlertTitle>
                                    <AlertDescription>
                                        {t(
                                            'updates.updater_offline_description',
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Form
                                    action="/updates/check"
                                    method="post"
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <Button
                                            type="submit"
                                            variant="outline"
                                            disabled={processing || active}
                                            className="w-full sm:w-auto"
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <RefreshCw />
                                            )}
                                            {t('updates.check_now')}
                                        </Button>
                                    )}
                                </Form>
                                <Button
                                    type="button"
                                    onClick={() => setDialogOpen(true)}
                                    disabled={
                                        active ||
                                        !release.candidate ||
                                        !release.manual_eligible ||
                                        !updater.online
                                    }
                                    className="w-full sm:w-auto"
                                >
                                    <ShieldCheck />
                                    {t('updates.update_now')}
                                </Button>
                            </div>

                            {release.candidate && !release.manual_eligible && (
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    {release.requires_host_steps
                                        ? t('updates.host_steps_required')
                                        : t('updates.not_installable')}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <AutomaticPolicy
                        settings={settings}
                        destinations={destinations}
                    />
                </div>
            </div>

            <UpdateDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                release={release}
                settings={settings}
                destinations={destinations}
            />
        </>
    );
}

function StateBadge({ state }: { state: string }) {
    const { t } = useI18n();
    const warning = ['unavailable', 'reconnecting'].includes(state);
    const danger = state === 'recovery_required';
    const active = ['checking', 'updating', 'reconnecting'].includes(state);

    return (
        <Badge
            className={cn(
                danger
                    ? 'bg-red-700'
                    : warning
                      ? 'bg-amber-700'
                      : state === 'available'
                        ? 'bg-emerald-600'
                        : 'bg-slate-700',
            )}
        >
            {active && <LoaderCircle className="animate-spin" />}
            {t(`updates.status_${state}` as Parameters<typeof t>[0])}
        </Badge>
    );
}

function VersionValue({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-mono font-medium">{value}</p>
        </div>
    );
}

function OperationProgress({
    operation,
    reconnecting,
}: {
    operation: Operation;
    reconnecting: boolean;
}) {
    const { t } = useI18n();
    const steps = [
        'backup',
        'validation',
        'download',
        'application',
        'restart',
        'verification',
    ] as const;
    const progress = operationProgress[operation.status];
    const failed = ['failed', 'recovery_required'].includes(operation.status);

    return (
        <Card
            className={cn(
                operation.status === 'recovery_required' && 'border-red-500/60',
            )}
        >
            <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                        {t('updates.operation_title', {
                            from: operation.from_version,
                            to: operation.to_version,
                        })}
                    </span>
                    <StateBadge
                        state={
                            reconnecting
                                ? 'reconnecting'
                                : operation.status === 'recovery_required'
                                  ? 'recovery_required'
                                  : activeStatuses.includes(operation.status)
                                    ? 'updating'
                                    : operation.status
                        }
                    />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <ol className="grid gap-3 md:grid-cols-6">
                    {steps.map((step, index) => {
                        const complete =
                            operation.status === 'succeeded' ||
                            index < progress;
                        const current = !failed && index === progress;

                        return (
                            <li
                                key={step}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg border p-3 text-xs md:flex-col md:items-start',
                                    complete &&
                                        'border-emerald-500/30 bg-emerald-500/5',
                                    current && 'border-primary/40 bg-primary/5',
                                )}
                            >
                                {complete ? (
                                    <Check className="size-4 text-emerald-600" />
                                ) : current ? (
                                    <LoaderCircle className="size-4 animate-spin text-primary" />
                                ) : (
                                    <Circle className="size-4 text-muted-foreground" />
                                )}
                                <span>{t(`updates.step_${step}`)}</span>
                            </li>
                        );
                    })}
                </ol>
                {operation.status === 'failed' && (
                    <Alert variant="destructive">
                        <AlertTriangle />
                        <AlertTitle>{t('updates.failed_title')}</AlertTitle>
                        <AlertDescription>
                            {t('updates.failed_description')}
                        </AlertDescription>
                    </Alert>
                )}
                {operation.status === 'recovery_required' && (
                    <Alert variant="destructive">
                        <AlertTriangle />
                        <AlertTitle>
                            {t('updates.recovery_required_title')}
                        </AlertTitle>
                        <AlertDescription>
                            {t('updates.recovery_required_description')}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}

function AutomaticPolicy({
    settings,
    destinations,
}: {
    settings: Settings;
    destinations: Destination[];
}) {
    const { t } = useI18n();
    const days = [
        { value: 1, label: 'updates.day_1' },
        { value: 2, label: 'updates.day_2' },
        { value: 3, label: 'updates.day_3' },
        { value: 4, label: 'updates.day_4' },
        { value: 5, label: 'updates.day_5' },
        { value: 6, label: 'updates.day_6' },
        { value: 7, label: 'updates.day_7' },
    ] as const;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-emerald-600" />
                    {t('updates.auto_policy')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                <Alert variant="destructive">
                    <AlertTriangle />
                    <AlertTitle>{t('updates.socket_risk_title')}</AlertTitle>
                    <AlertDescription>
                        {t('updates.socket_risk_description')}
                    </AlertDescription>
                </Alert>
                <Form
                    action="/updates/settings"
                    method="put"
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="auto_update" value="0" />
                            <label className="flex items-start gap-3 rounded-lg border p-4">
                                <input
                                    className="mt-1"
                                    type="checkbox"
                                    name="auto_update"
                                    value="1"
                                    defaultChecked={settings.auto_update}
                                    disabled={
                                        !settings.automatic_updates_accepted
                                    }
                                />
                                <span>
                                    <span className="block text-sm font-medium">
                                        {t('updates.auto')}
                                    </span>
                                    <span className="mt-1 block text-xs text-muted-foreground">
                                        {t('updates.auto_hint')}
                                    </span>
                                </span>
                            </label>
                            <InputError message={errors.auto_update} />
                            {!settings.automatic_updates_accepted && (
                                <Link
                                    href="/system"
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    {t('updates.accept_risk')}
                                </Link>
                            )}
                            <fieldset className="space-y-2">
                                <legend className="text-sm font-medium">
                                    {t('updates.days')}
                                </legend>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {days.map((day) => (
                                        <label
                                            key={day.value}
                                            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                name="days[]"
                                                value={day.value}
                                                defaultChecked={settings.days.includes(
                                                    day.value,
                                                )}
                                            />
                                            {t(day.label)}
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.days} />
                            </fieldset>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TimeField
                                    name="window_start"
                                    label={t('updates.window_start')}
                                    value={settings.window_start}
                                    error={errors.window_start}
                                />
                                <TimeField
                                    name="window_end"
                                    label={t('updates.window_end')}
                                    value={settings.window_end}
                                    error={errors.window_end}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t('updates.timezone_hint', {
                                    timezone: settings.timezone,
                                })}
                            </p>
                            <DestinationSelect
                                destinations={destinations}
                                defaultValue={settings.destination_id}
                                optional
                                error={errors.destination_id}
                            />
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                {t('updates.save_policy')}
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

function UpdateDialog({
    open,
    onOpenChange,
    release,
    settings,
    destinations,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    release: Release;
    settings: Settings;
    destinations: Destination[];
}) {
    const { t } = useI18n();

    if (!release.candidate) {
        return null;
    }

    const candidate = release.candidate;
    const major = release.compatibility === 'major_upgrade';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{t('updates.confirm_title')}</DialogTitle>
                    <DialogDescription>
                        {t('updates.confirm_description')}
                    </DialogDescription>
                </DialogHeader>
                <Form action="/updates/run" method="post" className="space-y-5">
                    {({ processing, errors }) => (
                        <>
                            <input
                                type="hidden"
                                name="to_version"
                                value={candidate}
                            />
                            <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                                <VersionValue
                                    label={t('updates.current_version')}
                                    value={`v${release.current.replace(/^v/, '')}`}
                                />
                                <VersionValue
                                    label={t('updates.target_version')}
                                    value={`v${candidate.replace(/^v/, '')}`}
                                />
                            </div>
                            <dl className="grid gap-3 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('updates.compatibility')}
                                    </dt>
                                    <dd className="font-medium">
                                        {major
                                            ? t('updates.major_release')
                                            : t('updates.compatible_release')}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('updates.estimated_downtime')}
                                    </dt>
                                    <dd className="font-medium">
                                        {t('updates.minutes', {
                                            count: Math.ceil(
                                                release.estimated_downtime_seconds /
                                                    60,
                                            ),
                                        })}
                                    </dd>
                                </div>
                            </dl>
                            <Alert>
                                <ShieldCheck />
                                <AlertTitle>
                                    {t('updates.snapshot_title')}
                                </AlertTitle>
                                <AlertDescription>
                                    {t('updates.snapshot_description')}
                                </AlertDescription>
                            </Alert>
                            <DestinationSelect
                                destinations={destinations}
                                defaultValue={settings.destination_id}
                                optional
                                error={errors.destination_id}
                            />
                            {major && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="update-confirmation">
                                        {t('updates.type_version', {
                                            version: candidate,
                                        })}
                                    </Label>
                                    <Input
                                        id="update-confirmation"
                                        name="confirmation"
                                        maxLength={64}
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.confirmation} />
                                </div>
                            )}
                            <label className="flex items-start gap-3 rounded-lg border p-4 text-sm">
                                <input
                                    className="mt-1"
                                    type="checkbox"
                                    name="accepted"
                                    value="1"
                                    required
                                />
                                <span>{t('updates.accept_update_risk')}</span>
                            </label>
                            <InputError message={errors.accepted} />
                            <InputError message={errors.update} />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? <Spinner /> : <ShieldCheck />}
                                    {t('updates.start_update')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DestinationSelect({
    destinations,
    defaultValue,
    optional,
    error,
}: {
    destinations: Destination[];
    defaultValue: number | null;
    optional?: boolean;
    error?: string;
}) {
    const { t } = useI18n();
    const id = useId();

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{t('updates.backup_destination')}</Label>
            <select
                id={id}
                name="destination_id"
                defaultValue={defaultValue ?? ''}
                required={!optional}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
                <option value="">
                    {optional
                        ? t('updates.local_snapshot_only')
                        : t('updates.select_destination')}
                </option>
                {destinations.map((destination) => (
                    <option key={destination.id} value={destination.id}>
                        {destination.name} ({destination.type})
                    </option>
                ))}
            </select>
            <p className="text-xs text-muted-foreground">
                {t('updates.destination_hint')}
            </p>
            <InputError message={error} />
        </div>
    );
}

function TimeField({
    name,
    label,
    value,
    error,
}: {
    name: string;
    label: string;
    value: string;
    error?: string;
}) {
    const id = useId();

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input id={id} name={name} type="time" defaultValue={value} />
            <InputError message={error} />
        </div>
    );
}
