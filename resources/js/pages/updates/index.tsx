import { Form, Head } from '@inertiajs/react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { useId } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n';

type Destination = { id: number; name: string; type: string };

export default function UpdatesIndex({
    status,
    settings,
    destinations,
}: {
    status: {
        online: boolean;
        available: boolean;
        current: string | null;
        candidate: string | null;
        error?: string;
    };
    settings: { auto_update: boolean; destination_id: number | null };
    destinations: Destination[];
}) {
    const { t } = useI18n();

    return (
        <>
            <Head title={t('updates.title')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('updates.eyebrow')}
                    title={t('updates.title')}
                    description={t('updates.description')}
                />
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                {t('updates.state')}
                                <Badge
                                    className={
                                        status.online
                                            ? 'bg-emerald-600'
                                            : 'bg-amber-700'
                                    }
                                >
                                    {status.online
                                        ? t('updates.connected')
                                        : t('updates.profile_disabled')}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t('updates.current_version')}
                                    </p>
                                    <p className="mt-1 font-mono font-medium">
                                        {status.current ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t('updates.available')}
                                    </p>
                                    <p className="mt-1 font-mono font-medium">
                                        {status.candidate ?? t('common.none')}
                                    </p>
                                </div>
                            </div>
                            {!status.online && (
                                <p className="text-sm text-muted-foreground">
                                    {t('updates.enable_hint')}{' '}
                                    <code>
                                        docker compose --profile auto-update up
                                        -d
                                    </code>{' '}
                                </p>
                            )}
                            <Form action="/updates/run" method="post">
                                {({ processing }) => (
                                    <div className="space-y-3">
                                        <DestinationSelect
                                            destinations={destinations}
                                            defaultValue={
                                                settings.destination_id
                                            }
                                        />
                                        <Button
                                            className="w-full"
                                            disabled={
                                                processing ||
                                                !status.available ||
                                                destinations.length === 0
                                            }
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <RefreshCw />
                                            )}
                                            {t('updates.backup_update')}
                                        </Button>
                                    </div>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="size-5 text-emerald-600" />
                                {t('updates.auto_policy')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form
                                action="/updates/settings"
                                method="put"
                                className="space-y-5"
                            >
                                {({ processing }) => (
                                    <>
                                        <input
                                            type="hidden"
                                            name="auto_update"
                                            value="0"
                                        />
                                        <label className="flex items-start gap-3 rounded-lg border p-4">
                                            <input
                                                className="mt-1"
                                                type="checkbox"
                                                name="auto_update"
                                                value="1"
                                                defaultChecked={
                                                    settings.auto_update
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
                                        <DestinationSelect
                                            destinations={destinations}
                                            defaultValue={
                                                settings.destination_id
                                            }
                                        />
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            disabled={
                                                processing ||
                                                destinations.length === 0
                                            }
                                        >
                                            {processing && <Spinner />}
                                            {t('updates.save_policy')}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function DestinationSelect({
    destinations,
    defaultValue,
}: {
    destinations: Destination[];
    defaultValue: number | null;
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
                required
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
                <option value="" disabled>
                    {t('updates.select_destination')}
                </option>
                {destinations.map((destination) => (
                    <option key={destination.id} value={destination.id}>
                        {destination.name} ({destination.type})
                    </option>
                ))}
            </select>
        </div>
    );
}
