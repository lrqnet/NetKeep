import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock3,
    Router,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

type Device = {
    id: number;
    name: string;
    ip_address: string;
    status: string;
    last_backup_at: string | null;
    group?: { name: string };
    site?: { name: string };
};

type Props = {
    stats: { total: number; healthy: number; failing: number; overdue: number };
    engine: { ok: boolean; nodes?: number; status?: number };
    recentDevices: Device[];
    recentChanges: Array<{
        id: number;
        finished_at: string;
        device: { name: string };
    }>;
};

const statusClass: Record<string, string> = {
    healthy:
        'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    failing: 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300',
    pending:
        'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    disabled: 'text-muted-foreground',
};

export default function Dashboard({
    stats,
    engine,
    recentDevices,
    recentChanges,
}: Props) {
    const { t, formatNumber } = useI18n();
    const cards = [
        {
            label: t('dashboard.protected'),
            value: stats.total,
            icon: Router,
        },
        {
            label: t('dashboard.healthy'),
            value: stats.healthy,
            icon: CheckCircle2,
        },
        {
            label: t('dashboard.failing'),
            value: stats.failing,
            icon: AlertTriangle,
        },
        {
            label: t('dashboard.overdue'),
            value: stats.overdue,
            icon: Clock3,
        },
    ];

    return (
        <>
            <Head title={t('dashboard.title')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('dashboard.operation')}
                    title={t('dashboard.heading')}
                    description={t('dashboard.description')}
                    actions={
                        <Button asChild>
                            <Link href="/devices">
                                {t('dashboard.manage_devices')}
                            </Link>
                        </Button>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map(({ label, value, icon: Icon }, index) => (
                        <Card key={label} className="gap-3 py-5">
                            <CardContent className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {label}
                                    </p>
                                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                                        {formatNumber(value)}
                                    </p>
                                </div>
                                <span
                                    className={`grid size-10 place-items-center rounded-xl ${
                                        index === 2
                                            ? 'bg-red-500/10 text-red-600'
                                            : index === 3
                                              ? 'bg-amber-500/10 text-amber-600'
                                              : 'bg-emerald-500/10 text-emerald-600'
                                    }`}
                                >
                                    <Icon className="size-5" />
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                    <Card className="gap-0 py-0">
                        <CardHeader className="flex-row items-center justify-between border-b py-5">
                            <div>
                                <CardTitle>
                                    {t('dashboard.recent_devices')}
                                </CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {t('dashboard.last_activity')}
                                </p>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/devices">
                                    {t('dashboard.view_all')} <ArrowRight />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="px-0">
                            {recentDevices.length === 0 ? (
                                <div className="p-10 text-center">
                                    <Router className="mx-auto size-8 text-muted-foreground" />
                                    <p className="mt-3 font-medium">
                                        {t('dashboard.no_devices')}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {t('dashboard.no_devices_hint')}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {recentDevices.map((device) => (
                                        <div
                                            key={device.id}
                                            className="flex items-center gap-4 px-6 py-4"
                                        >
                                            <span className="grid size-9 place-items-center rounded-lg bg-muted">
                                                <Router className="size-4" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {device.name}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {device.site?.name ??
                                                        t(
                                                            'dashboard.no_site',
                                                        )}{' '}
                                                    · {device.ip_address}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    statusClass[device.status]
                                                }
                                            >
                                                {t(
                                                    `status.${device.status}` as
                                                        | 'status.healthy'
                                                        | 'status.failing'
                                                        | 'status.pending'
                                                        | 'status.conflict'
                                                        | 'status.disabled',
                                                )}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="gap-4 border-emerald-500/20 bg-emerald-500/[.03] py-5">
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                        <Activity className="size-5" />
                                    </span>
                                    <Badge
                                        className={
                                            engine.ok
                                                ? 'bg-emerald-600'
                                                : 'bg-red-600'
                                        }
                                    >
                                        {engine.ok
                                            ? t('dashboard.engine_online')
                                            : t('dashboard.engine_unavailable')}
                                    </Badge>
                                </div>
                                <p className="mt-4 text-lg font-semibold">
                                    Oxidized 0.37.0
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {engine.ok
                                        ? t('dashboard.engine_nodes', {
                                              count: engine.nodes ?? 0,
                                          })
                                        : t('dashboard.engine_hint')}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="gap-3 py-5">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    {t('dashboard.recent_changes')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {recentChanges.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        {t('dashboard.no_changes')}
                                    </p>
                                ) : (
                                    recentChanges.map((change) => (
                                        <div
                                            key={change.id}
                                            className="flex items-start gap-3"
                                        >
                                            <span className="mt-1.5 size-2 rounded-full bg-amber-400" />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {change.device.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t(
                                                        'dashboard.configuration_changed',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
