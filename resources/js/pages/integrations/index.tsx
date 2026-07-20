import { Form, Head } from '@inertiajs/react';
import { DatabaseZap, Plus, RefreshCw } from 'lucide-react';
import { FormField, NativeSelect, PageSection } from '@/components/admin-form';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n';

type InventorySource = {
    id: number;
    type: string;
    name: string;
    base_url: string;
    enabled: boolean;
    sync_interval: number;
    last_synced_at: string | null;
    last_error: string | null;
    has_token: boolean;
};

export default function IntegrationsIndex({
    inventorySources,
}: {
    inventorySources: InventorySource[];
}) {
    const { t, formatDateTime } = useI18n();

    return (
        <>
            <Head title={t('integrations.title')} />
            <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('integrations.eyebrow')}
                    title={t('integrations.heading')}
                    description={t('integrations.description')}
                />

                <PageSection
                    icon={DatabaseZap}
                    title={t('integrations.inventory')}
                    description={t('integrations.inventory_description')}
                >
                    <div className="grid gap-4 lg:grid-cols-2">
                        {inventorySources.map((source) => (
                            <Card key={source.id} className="gap-4 py-5">
                                <CardHeader className="flex-row items-start justify-between">
                                    <div>
                                        <CardTitle className="text-base">
                                            {source.name}
                                        </CardTitle>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {source.base_url}
                                        </p>
                                    </div>
                                    <Badge variant="outline">
                                        {source.type}
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    {source.last_error && (
                                        <p className="mb-4 rounded-md bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                                            {source.last_error}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between border-t pt-4">
                                        <p className="text-xs text-muted-foreground">
                                            {source.last_synced_at
                                                ? t('integrations.last_sync', {
                                                      date: formatDateTime(
                                                          source.last_synced_at,
                                                      ),
                                                  })
                                                : t(
                                                      'integrations.never_synced',
                                                  )}
                                        </p>
                                        <Form
                                            action={`/integrations/inventory/${source.id}/sync`}
                                            method="post"
                                            options={{
                                                preserveScroll: true,
                                            }}
                                        >
                                            {({ processing }) => (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={processing}
                                                >
                                                    {processing ? (
                                                        <Spinner />
                                                    ) : (
                                                        <RefreshCw />
                                                    )}
                                                    {t('integrations.sync')}
                                                </Button>
                                            )}
                                        </Form>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        <Card className="gap-4 border-dashed py-5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Plus className="size-4 text-emerald-600" />
                                    {t('integrations.add_source')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Form
                                    action="/integrations/inventory"
                                    method="post"
                                    resetOnSuccess
                                    options={{ preserveScroll: true }}
                                    className="grid gap-4 sm:grid-cols-2"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <NativeSelect
                                                label={t(
                                                    'integrations.platform',
                                                )}
                                                name="type"
                                                options={[
                                                    ['librenms', 'LibreNMS'],
                                                    ['netbox', 'NetBox'],
                                                ]}
                                                error={errors.type}
                                            />
                                            <FormField
                                                label={t('common.name')}
                                                name="name"
                                                placeholder={t(
                                                    'integrations.main_noc',
                                                )}
                                                maxLength={120}
                                                required
                                                error={errors.name}
                                            />
                                            <div className="sm:col-span-2">
                                                <FormField
                                                    label={t(
                                                        'integrations.base_url',
                                                    )}
                                                    name="base_url"
                                                    type="url"
                                                    placeholder="https://netbox.example.com"
                                                    maxLength={1000}
                                                    required
                                                    error={errors.base_url}
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <FormField
                                                    label={t(
                                                        'integrations.api_token',
                                                    )}
                                                    name="token"
                                                    type="password"
                                                    maxLength={10000}
                                                    required
                                                    autoComplete="new-password"
                                                    error={errors.token}
                                                />
                                            </div>
                                            <input
                                                type="hidden"
                                                name="sync_interval"
                                                value="900"
                                            />
                                            <input
                                                type="hidden"
                                                name="enabled"
                                                value="1"
                                            />
                                            <Button
                                                className="sm:col-span-2"
                                                disabled={processing}
                                            >
                                                {processing && <Spinner />}
                                                {t('integrations.save_source')}
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </PageSection>
            </div>
        </>
    );
}
