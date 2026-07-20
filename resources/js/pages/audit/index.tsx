import { Head, Link } from '@inertiajs/react';
import { FileClock, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { isTranslationKey, useI18n } from '@/i18n';

type Event = {
    id: number;
    action: string;
    subject_type: string | null;
    subject_id: number | null;
    ip_address: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    user?: { name: string; email: string };
};
type Paginator = {
    data: Event[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export default function AuditIndex({ events }: { events: Paginator }) {
    const { t, formatDateTime } = useI18n();

    return (
        <>
            <Head title={t('audit.title')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('audit.eyebrow')}
                    title={t('audit.title')}
                    description={t('audit.description')}
                />
                <Card className="gap-0 overflow-hidden py-0">
                    <CardContent className="px-0">
                        {events.data.length === 0 ? (
                            <div className="py-16 text-center">
                                <FileClock className="mx-auto size-9 text-muted-foreground" />
                                <p className="mt-4 font-medium">
                                    {t('audit.empty')}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {events.data.map((event) => (
                                    <div
                                        key={event.id}
                                        className="grid gap-3 px-6 py-4 md:grid-cols-[40px_1fr_auto]"
                                    >
                                        <span className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                            <ShieldCheck className="size-4" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {(() => {
                                                    const actionKey = `audit.action.${event.action}`;

                                                    return isTranslationKey(
                                                        actionKey,
                                                    )
                                                        ? t(actionKey)
                                                        : event.action;
                                                })()}
                                            </p>
                                            <p
                                                className="mt-1 font-mono text-[11px] text-muted-foreground"
                                                data-technical-code
                                            >
                                                {t('audit.technical_code', {
                                                    code: event.action,
                                                })}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {event.user?.name ??
                                                    t('common.system')}{' '}
                                                ·{' '}
                                                {event.ip_address ??
                                                    t('common.internal')}
                                                {event.subject_type
                                                    ? ` · ${event.subject_type} #${event.subject_id}`
                                                    : ''}
                                            </p>
                                            {event.metadata &&
                                                Object.keys(event.metadata)
                                                    .length > 0 && (
                                                    <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-2 text-[11px] text-foreground">
                                                        {JSON.stringify(
                                                            event.metadata,
                                                            null,
                                                            2,
                                                        )}
                                                    </pre>
                                                )}
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="self-start"
                                        >
                                            {formatDateTime(event.created_at)}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                        {events.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <span className="text-sm text-muted-foreground">
                                    {t('common.page_of', {
                                        current: events.current_page,
                                        total: events.last_page,
                                    })}
                                </span>
                                <div className="flex gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link
                                            href={events.prev_page_url ?? '#'}
                                        >
                                            {t('common.previous')}
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm">
                                        <Link
                                            href={events.next_page_url ?? '#'}
                                        >
                                            {t('common.next')}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
