import { Head } from '@inertiajs/react';
import { Download, GitCompareArrows, History, Router } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';

type Props = {
    device: {
        id: number;
        name: string;
        ip_address: string;
        oxidized_model: string;
        group?: { name: string };
        site?: { name: string };
    };
    versions: Array<{
        hash: string;
        date: string;
        author: string;
        subject: string;
    }>;
    content: string;
};

export default function ConfigurationShow({
    device,
    versions,
    content,
}: Props) {
    const { t, formatDateTime } = useI18n();

    return (
        <>
            <Head title={t('config.title', { name: device.name })} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('config.git_history')}
                    title={device.name}
                    description={`${device.ip_address} · ${device.oxidized_model} · ${device.group?.name ?? 'default'}`}
                    actions={
                        <Button asChild variant="outline">
                            <a
                                href={`/devices/${device.id}/configuration/download`}
                            >
                                <Download />
                                {t('config.download')}
                            </a>
                        </Button>
                    }
                />

                <div className="grid items-start gap-6 xl:grid-cols-[280px_1fr]">
                    <Card className="gap-3 py-5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <History className="size-4 text-emerald-600" />
                                {t('config.versions')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {versions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t('config.no_versions')}
                                </p>
                            ) : (
                                versions.map((version, index) => (
                                    <div
                                        key={version.hash}
                                        className="rounded-lg border p-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <code className="text-xs font-medium">
                                                {version.hash.slice(0, 8)}
                                            </code>
                                            {index === 0 && (
                                                <Badge className="bg-emerald-600">
                                                    {t('config.current_badge')}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-2 line-clamp-2 text-xs">
                                            {version.subject}
                                        </p>
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                            {formatDateTime(version.date)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card className="min-w-0 gap-0 overflow-hidden py-0">
                        <CardHeader className="flex-row items-center justify-between border-b py-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Router className="size-4 text-emerald-600" />
                                    {t('config.current')}
                                </CardTitle>
                            </div>
                            <Button variant="ghost" size="sm" disabled>
                                <GitCompareArrows />
                                {t('config.compare')}
                            </Button>
                        </CardHeader>
                        <CardContent className="px-0">
                            <pre className="max-h-[72vh] overflow-auto bg-[#07111f] p-5 font-mono text-xs leading-5 text-slate-200">
                                {content || t('config.awaiting_first')}
                            </pre>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
