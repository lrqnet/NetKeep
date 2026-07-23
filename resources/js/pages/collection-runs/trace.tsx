import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';

export default function CollectionTrace({
    run,
    trace,
}: {
    run: {
        uuid: string;
        device_id: number;
        device_name: string;
        expires_at: string;
        truncated: boolean;
    };
    trace: string;
}) {
    const { t, formatDateTime } = useI18n();

    return (
        <>
            <Head
                title={t('collections.trace_title', { name: run.device_name })}
            />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button variant="outline" asChild>
                        <Link href={`/devices/${run.device_id}/edit`}>
                            <ArrowLeft /> {t('devices.back')}
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <a href={`/collection-runs/${run.uuid}/trace/download`}>
                            <Download /> {t('collections.download_trace')}
                        </a>
                    </Button>
                </div>
                <Card className="border-red-500/50 bg-red-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                            <AlertTriangle className="size-5" />
                            {t('collections.trace_title', {
                                name: run.device_name,
                            })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>{t('collections.raw_trace_warning')}</p>
                        <p>
                            {t('collections.expires', {
                                time: formatDateTime(run.expires_at),
                            })}
                        </p>
                        {run.truncated && (
                            <p className="font-medium text-red-700 dark:text-red-300">
                                {t('collections.trace_truncated_warning')}
                            </p>
                        )}
                    </CardContent>
                </Card>
                <pre
                    className="max-h-[70vh] overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-5 break-words whitespace-pre-wrap"
                    tabIndex={0}
                >
                    {trace}
                </pre>
            </div>
        </>
    );
}
