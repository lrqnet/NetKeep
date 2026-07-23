import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    Download,
    RefreshCw,
    Search,
    Stethoscope,
} from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { isTranslationKey, useI18n } from '@/i18n';

type Artifact = {
    uuid: string;
    type: string;
    size: number;
    truncated: boolean;
    expires_at: string;
    purged_at: string | null;
    available: boolean;
};

type CollectionRun = {
    uuid: string;
    trigger: string;
    status: string;
    attempt: number;
    priority: number;
    scheduled_for: string;
    dispatched_at: string | null;
    started_at: string | null;
    finished_at: string | null;
    duration_seconds: number | null;
    error_code: string | null;
    engine_reference?: string | null;
    requested_by: { id: number; name: string } | null;
    parent_uuid: string | null;
    artifact: Artifact | null;
};

type CollectionEvent = {
    id: number;
    event_id: string;
    occurred_at: string;
    source: string;
    level: string;
    code: string;
    technical_message?: string | null;
    context?: Record<string, unknown> | null;
};

type CollectionResponse = {
    data: CollectionRun[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

export function DeviceCollectionHistory({
    deviceId,
    canDiagnose,
}: {
    deviceId: number;
    canDiagnose: boolean;
}) {
    const { t, formatDateTime, formatNumber } = useI18n();
    const [runs, setRuns] = useState<CollectionRun[]>([]);
    const [meta, setMeta] = useState<CollectionResponse['meta'] | null>(null);
    const [selected, setSelected] = useState<CollectionRun | null>(null);
    const [events, setEvents] = useState<CollectionEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [origin, setOrigin] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [diagnosing, setDiagnosing] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [streamError, setStreamError] = useState(false);
    const streamRef = useRef<EventSource | null>(null);
    const lastEventIdRef = useRef(0);
    const selectedUuid = selected?.uuid;

    const dynamicText = useCallback(
        (prefix: string, value: string): string => {
            const key = `${prefix}.${value}`;

            return isTranslationKey(key) ? t(key) : value.replaceAll('_', ' ');
        },
        [t],
    );

    const loadRuns = useCallback(
        async (page = 1): Promise<void> => {
            setLoading(true);
            setLoadError(false);
            const query = new URLSearchParams({ page: String(page) });

            if (status) {
                query.set('status', status);
            }

            if (origin) {
                query.set('origin', origin);
            }

            if (from) {
                query.set('from', from);
            }

            if (to) {
                query.set('to', to);
            }

            try {
                const response = await fetch(
                    `/devices/${deviceId}/collection-runs?${query.toString()}`,
                    { headers: { Accept: 'application/json' } },
                );

                if (!response.ok) {
                    throw new Error('collection_runs_failed');
                }

                const payload = (await response.json()) as CollectionResponse;
                setRuns(payload.data);
                setMeta(payload.meta);
                setSelected((current) => {
                    if (
                        current &&
                        !payload.data.some((run) => run.uuid === current.uuid)
                    ) {
                        setEvents([]);
                        lastEventIdRef.current = 0;

                        return null;
                    }

                    return current;
                });
            } catch {
                setLoadError(true);
            } finally {
                setLoading(false);
            }
        },
        [deviceId, from, origin, status, to],
    );

    const loadDetails = useCallback(
        async (run: Pick<CollectionRun, 'uuid'>): Promise<void> => {
            setDetailLoading(true);
            setLoadError(false);

            try {
                const response = await fetch(
                    `/collection-runs/${run.uuid}/events`,
                    { headers: { Accept: 'application/json' } },
                );

                if (!response.ok) {
                    throw new Error('collection_events_failed');
                }

                const payload = (await response.json()) as {
                    run: CollectionRun;
                    events: CollectionEvent[];
                };
                setSelected(payload.run);
                setEvents(payload.events);
                lastEventIdRef.current = payload.events.at(-1)?.id ?? 0;
            } catch {
                setLoadError(true);
            } finally {
                setDetailLoading(false);
            }
        },
        [],
    );

    useEffect(() => {
        void Promise.resolve().then(() => loadRuns());
    }, [loadRuns]);

    useEffect(() => {
        streamRef.current?.close();

        if (!selectedUuid) {
            return;
        }

        const stream = new EventSource(
            `/collection-runs/${selectedUuid}/stream?after=${lastEventIdRef.current}`,
        );
        streamRef.current = stream;
        stream.addEventListener('open', () => setStreamError(false));
        stream.addEventListener('error', () => setStreamError(true));
        stream.addEventListener('collection.event', (message) => {
            const event = JSON.parse(
                (message as MessageEvent<string>).data,
            ) as CollectionEvent;
            lastEventIdRef.current = Math.max(lastEventIdRef.current, event.id);
            setEvents((current) =>
                current.some((candidate) => candidate.id === event.id)
                    ? current
                    : [...current, event],
            );
        });
        stream.addEventListener('collection.status', (message) => {
            const update = JSON.parse(
                (message as MessageEvent<string>).data,
            ) as {
                status: string;
            };
            setSelected((current) =>
                current && current.status !== update.status
                    ? { ...current, status: update.status }
                    : current,
            );
        });
        stream.addEventListener('end', () => {
            stream.close();
            void loadDetails({ uuid: selectedUuid });

            void loadRuns(meta?.current_page ?? 1);
        });

        return () => stream.close();
    }, [loadDetails, loadRuns, meta?.current_page, selectedUuid]);

    const startDiagnostic = (): void => {
        if (confirmation !== 'DIAGNOSTIC') {
            return;
        }

        setDiagnosing(true);
        router.post(
            `/devices/${deviceId}/diagnostics`,
            { risk_confirmation: confirmation },
            {
                preserveScroll: true,
                onFinish: () => setDiagnosing(false),
                onSuccess: () => {
                    setConfirmation('');
                    void loadRuns();
                },
            },
        );
    };

    return (
        <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)]">
            <div className="space-y-5">
                {canDiagnose && (
                    <Card className="border-red-500/50 bg-red-500/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                                <AlertTriangle className="size-5" />
                                {t('collections.diagnostic_title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm leading-6 text-muted-foreground">
                                {t('collections.diagnostic_warning')}
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="diagnostic-confirmation">
                                    {t('collections.diagnostic_confirmation')}
                                </Label>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Input
                                        id="diagnostic-confirmation"
                                        value={confirmation}
                                        onChange={(event) =>
                                            setConfirmation(event.target.value)
                                        }
                                        autoComplete="off"
                                        spellCheck={false}
                                    />
                                    <Button
                                        variant="destructive"
                                        disabled={
                                            diagnosing ||
                                            confirmation !== 'DIAGNOSTIC'
                                        }
                                        onClick={startDiagnostic}
                                    >
                                        {diagnosing ? (
                                            <Spinner />
                                        ) : (
                                            <Stethoscope />
                                        )}
                                        {t('collections.start_diagnostic')}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>{t('collections.history')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <FilterSelect
                                label={t('collections.status_filter')}
                                value={status}
                                onChange={setStatus}
                                options={[
                                    '',
                                    'queued',
                                    'dispatched',
                                    'running',
                                    'succeeded',
                                    'failed',
                                    'cooldown',
                                    'cancelled',
                                ]}
                                text={(value) =>
                                    value
                                        ? dynamicText(
                                              'collections.status',
                                              value,
                                          )
                                        : t('collections.all')
                                }
                            />
                            <FilterSelect
                                label={t('collections.origin_filter')}
                                value={origin}
                                onChange={setOrigin}
                                options={[
                                    '',
                                    'manual',
                                    'scheduled',
                                    'retry',
                                    'diagnostic',
                                    'model_test',
                                ]}
                                text={(value) =>
                                    value
                                        ? dynamicText(
                                              'collections.trigger',
                                              value,
                                          )
                                        : t('collections.all')
                                }
                            />
                            <DateFilter
                                label={t('collections.from')}
                                value={from}
                                onChange={setFrom}
                            />
                            <DateFilter
                                label={t('collections.to')}
                                value={to}
                                onChange={setTo}
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => void loadRuns()}
                            disabled={loading}
                        >
                            {loading ? <Spinner /> : <Search />}
                            {t('collections.apply_filters')}
                        </Button>
                        {loadError && (
                            <p
                                role="alert"
                                className="text-sm text-destructive"
                            >
                                {t('collections.load_error')}
                            </p>
                        )}

                        {loading && runs.length === 0 ? (
                            <div className="flex justify-center py-10">
                                <Spinner />
                            </div>
                        ) : runs.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                {t('collections.empty')}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {runs.map((run) => (
                                    <button
                                        key={run.uuid}
                                        type="button"
                                        onClick={() => void loadDetails(run)}
                                        className="flex w-full flex-col gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="outline">
                                                    {dynamicText(
                                                        'collections.trigger',
                                                        run.trigger,
                                                    )}
                                                </Badge>
                                                <Badge
                                                    variant={
                                                        run.status === 'failed'
                                                            ? 'destructive'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {dynamicText(
                                                        'collections.status',
                                                        run.status,
                                                    )}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {t('collections.attempt', {
                                                        number: run.attempt,
                                                    })}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm">
                                                {formatDateTime(
                                                    run.scheduled_for,
                                                )}
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {run.requested_by?.name ??
                                                t(
                                                    'collections.system_requester',
                                                )}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {meta && meta.last_page > 1 && (
                            <div className="flex items-center justify-between border-t pt-4">
                                <Button
                                    variant="outline"
                                    disabled={meta.current_page <= 1 || loading}
                                    onClick={() =>
                                        void loadRuns(meta.current_page - 1)
                                    }
                                >
                                    {t('common.previous')}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {t('collections.page', {
                                        current: meta.current_page,
                                        total: meta.last_page,
                                    })}
                                </span>
                                <Button
                                    variant="outline"
                                    disabled={
                                        meta.current_page >= meta.last_page ||
                                        loading
                                    }
                                    onClick={() =>
                                        void loadRuns(meta.current_page + 1)
                                    }
                                >
                                    {t('common.next')}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="h-fit lg:sticky lg:top-6">
                <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                        <CardTitle>{t('collections.details')}</CardTitle>
                        {selected && (
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t('collections.refresh')}
                                onClick={() => void loadDetails(selected)}
                            >
                                <RefreshCw />
                            </Button>
                        )}
                    </div>
                    {streamError && selected && (
                        <p
                            role="status"
                            className="text-xs text-muted-foreground"
                        >
                            {t('collections.stream_unavailable')}
                        </p>
                    )}
                </CardHeader>
                <CardContent>
                    {!selected ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            {t('collections.select_run')}
                        </p>
                    ) : detailLoading ? (
                        <div className="flex justify-center py-10">
                            <Spinner />
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <Detail
                                    label={t('collections.origin')}
                                    value={dynamicText(
                                        'collections.trigger',
                                        selected.trigger,
                                    )}
                                />
                                <Detail
                                    label={t('collections.status_label')}
                                    value={dynamicText(
                                        'collections.status',
                                        selected.status,
                                    )}
                                />
                                <Detail
                                    label={t('collections.requester')}
                                    value={
                                        selected.requested_by?.name ??
                                        t('collections.system_requester')
                                    }
                                />
                                <Detail
                                    label={t('collections.attempt_label')}
                                    value={String(selected.attempt)}
                                />
                                <Detail
                                    label={t('collections.started')}
                                    value={
                                        selected.started_at
                                            ? formatDateTime(
                                                  selected.started_at,
                                              )
                                            : '—'
                                    }
                                />
                                <Detail
                                    label={t('collections.finished')}
                                    value={
                                        selected.finished_at
                                            ? formatDateTime(
                                                  selected.finished_at,
                                              )
                                            : '—'
                                    }
                                />
                                <Detail
                                    label={t('collections.duration')}
                                    value={
                                        selected.duration_seconds === null
                                            ? '—'
                                            : t('collections.seconds', {
                                                  seconds: formatNumber(
                                                      selected.duration_seconds,
                                                  ),
                                              })
                                    }
                                />
                                <Detail
                                    label={t('collections.parent')}
                                    value={selected.parent_uuid ?? '—'}
                                    mono
                                />
                                {selected.engine_reference !== undefined && (
                                    <Detail
                                        label={t(
                                            'collections.engine_reference',
                                        )}
                                        value={selected.engine_reference ?? '—'}
                                        mono
                                    />
                                )}
                            </dl>

                            {selected.error_code && (
                                <div className="rounded-md border border-red-500/40 bg-red-500/5 p-3">
                                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                        {dynamicText(
                                            'collections.error',
                                            selected.error_code,
                                        )}
                                    </p>
                                </div>
                            )}

                            <ArtifactPanel
                                run={selected}
                                canAccess={canDiagnose}
                                formatDateTime={formatDateTime}
                                formatNumber={formatNumber}
                            />

                            <div>
                                <h3 className="font-medium">
                                    {t('collections.timeline')}
                                </h3>
                                <ol className="mt-3 space-y-4 border-l pl-4">
                                    {events.map((event) => (
                                        <li
                                            key={event.event_id}
                                            className="relative"
                                        >
                                            <span className="absolute top-1.5 -left-[1.3rem] size-2.5 rounded-full bg-primary" />
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-medium">
                                                    {dynamicText(
                                                        'collections.event',
                                                        event.code,
                                                    )}
                                                </p>
                                                <Badge variant="outline">
                                                    {event.source}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {formatDateTime(
                                                    event.occurred_at,
                                                )}
                                            </p>
                                            {event.technical_message && (
                                                <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs break-words whitespace-pre-wrap">
                                                    {event.technical_message}
                                                </pre>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function ArtifactPanel({
    run,
    canAccess,
    formatDateTime,
    formatNumber,
}: {
    run: CollectionRun;
    canAccess: boolean;
    formatDateTime: (value: string) => string;
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}) {
    const { t } = useI18n();
    const artifact = run.artifact;

    if (!artifact) {
        return null;
    }

    return (
        <div className="space-y-3 rounded-md border border-red-500/40 bg-red-500/5 p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300">
                <AlertTriangle className="size-4" />
                {t('collections.raw_trace')}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
                {t('collections.raw_trace_warning')}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{formatNumber(artifact.size)} B</span>
                <span>
                    {t('collections.expires', {
                        time: formatDateTime(artifact.expires_at),
                    })}
                </span>
                {artifact.truncated && (
                    <Badge variant="destructive">
                        {t('collections.truncated')}
                    </Badge>
                )}
                {!artifact.available && (
                    <Badge variant="outline">{t('collections.purged')}</Badge>
                )}
            </div>
            {canAccess && artifact.available && (
                <div className="flex flex-wrap gap-2">
                    <Button variant="destructive" size="sm" asChild>
                        <a href={`/collection-runs/${run.uuid}/trace`}>
                            {t('collections.view_trace')}
                        </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <a href={`/collection-runs/${run.uuid}/trace/download`}>
                            <Download /> {t('collections.download_trace')}
                        </a>
                    </Button>
                </div>
            )}
        </div>
    );
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
    text,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    text: (value: string) => string;
}) {
    const id = useId();

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <select
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
                {options.map((option) => (
                    <option key={option || 'all'} value={option}>
                        {text(option)}
                    </option>
                ))}
            </select>
        </div>
    );
}

function DateFilter({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const id = useId();

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type="date"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function Detail({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className={`mt-1 break-all ${mono ? 'font-mono text-xs' : ''}`}>
                {value}
            </dd>
        </div>
    );
}
