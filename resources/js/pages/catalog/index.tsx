import { Form, Head, router } from '@inertiajs/react';
import { Building2, MapPin, Network, Plus, Tags, Trash2 } from 'lucide-react';
import { useId } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n';

type Named = { id: number; name: string };
type Site = Named & { location?: string | null };
type Group = Named & { remove_secrets: boolean };
type Tag = Named & { color: string };
type Manufacturer = Named & { website?: string | null };
type HardwareModel = Named & {
    oxidized_model?: string | null;
    manufacturer?: Manufacturer | null;
};

export default function CatalogIndex({
    sites,
    groups,
    tags,
    manufacturers,
    hardwareModels,
}: {
    sites: Site[];
    groups: Group[];
    tags: Tag[];
    manufacturers: Manufacturer[];
    hardwareModels: HardwareModel[];
}) {
    const { t } = useI18n();

    return (
        <>
            <Head title={t('catalog.title')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('devices.inventory')}
                    title={t('catalog.title')}
                    description={t('catalog.description')}
                />
                <div className="grid gap-6 xl:grid-cols-2">
                    <CatalogCard
                        title={t('catalog.sites')}
                        icon={MapPin}
                        kind="site"
                        items={sites.map((site) => ({
                            ...site,
                            detail: site.location ?? undefined,
                        }))}
                        fields={
                            <>
                                <Field
                                    label={t('common.name')}
                                    name="name"
                                    required
                                />
                                <Field
                                    label={t('catalog.location')}
                                    name="location"
                                />
                            </>
                        }
                    />
                    <CatalogCard
                        title={t('catalog.groups')}
                        icon={Network}
                        kind="group"
                        items={groups.map((group) => ({
                            ...group,
                            detail: group.remove_secrets
                                ? t('catalog.secret_removal_active')
                                : t('catalog.full_configuration'),
                        }))}
                        fields={
                            <>
                                <Field
                                    label={t('common.name')}
                                    name="name"
                                    required
                                />
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        name="remove_secrets"
                                        value="1"
                                    />
                                    {t('catalog.remove_secrets')}
                                </label>
                            </>
                        }
                    />
                    <CatalogCard
                        title={t('catalog.tags')}
                        icon={Tags}
                        kind="tag"
                        items={tags.map((tag) => ({
                            ...tag,
                            detail: tag.color,
                            color: tag.color,
                        }))}
                        fields={
                            <div className="grid grid-cols-[1fr_80px] gap-3">
                                <Field
                                    label={t('common.name')}
                                    name="name"
                                    required
                                />
                                <Field
                                    label={t('catalog.color')}
                                    name="color"
                                    type="color"
                                    defaultValue="#10b981"
                                    required
                                />
                            </div>
                        }
                    />
                    <CatalogCard
                        title={t('catalog.manufacturers')}
                        icon={Building2}
                        kind="manufacturer"
                        items={manufacturers.map((manufacturer) => ({
                            ...manufacturer,
                            detail: manufacturer.website ?? undefined,
                        }))}
                        fields={
                            <>
                                <Field
                                    label={t('common.name')}
                                    name="name"
                                    required
                                />
                                <Field
                                    label={t('catalog.official_site')}
                                    name="website"
                                    type="url"
                                />
                            </>
                        }
                    />
                    <CatalogCard
                        title={t('catalog.hardware_models')}
                        icon={Network}
                        kind="hardware_model"
                        items={hardwareModels.map((model) => ({
                            ...model,
                            detail: [
                                model.manufacturer?.name,
                                model.oxidized_model &&
                                    `driver ${model.oxidized_model}`,
                            ]
                                .filter(Boolean)
                                .join(' · '),
                        }))}
                        fields={
                            <>
                                <Field
                                    label={t('devices.model')}
                                    name="name"
                                    required
                                />
                                <div className="space-y-1.5">
                                    <Label htmlFor="hardware-manufacturer">
                                        {t('devices.manufacturer')}
                                    </Label>
                                    <select
                                        id="hardware-manufacturer"
                                        name="manufacturer_id"
                                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    >
                                        <option value="">
                                            {t('catalog.no_manufacturer')}
                                        </option>
                                        {manufacturers.map((manufacturer) => (
                                            <option
                                                key={manufacturer.id}
                                                value={manufacturer.id}
                                            >
                                                {manufacturer.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Field
                                    label={t('catalog.suggested_driver')}
                                    name="oxidized_model"
                                    placeholder="ios, junos, routeros..."
                                />
                            </>
                        }
                    />
                </div>
            </div>
        </>
    );
}

function CatalogCard({
    title,
    icon: Icon,
    kind,
    items,
    fields,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    kind: string;
    items: Array<Named & { detail?: string; color?: string }>;
    fields: React.ReactNode;
}) {
    const { t } = useI18n();

    return (
        <Card className="gap-4 py-5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="size-4 text-emerald-600" />
                    {title}
                    <Badge variant="secondary">{items.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="max-h-52 divide-y overflow-auto rounded-md border">
                    {items.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">
                            {t('catalog.empty')}
                        </p>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 px-3 py-2"
                            >
                                {item.color && (
                                    <span
                                        className="size-3 rounded-full"
                                        style={{ background: item.color }}
                                    />
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {item.name}
                                    </p>
                                    {item.detail && (
                                        <p className="truncate text-xs text-muted-foreground">
                                            {item.detail}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    title={t('common.remove')}
                                    onClick={() => {
                                        if (
                                            confirm(
                                                t('catalog.remove_confirm', {
                                                    name: item.name,
                                                }),
                                            )
                                        ) {
                                            router.delete(
                                                `/catalog/${kind}/${item.id}`,
                                                { preserveScroll: true },
                                            );
                                        }
                                    }}
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
                <Form
                    action="/catalog"
                    method="post"
                    resetOnSuccess
                    options={{ preserveScroll: true }}
                    className="space-y-3 border-t pt-4"
                >
                    {({ processing }) => (
                        <>
                            <input type="hidden" name="kind" value={kind} />
                            {fields}
                            <Button
                                variant="outline"
                                className="w-full"
                                disabled={processing}
                            >
                                {processing ? <Spinner /> : <Plus />}
                                {t('common.add')}
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

function Field(props: React.ComponentProps<typeof Input> & { label: string }) {
    const { label, ...inputProps } = props;
    const generatedId = useId();
    const id = inputProps.id ?? generatedId;

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input {...inputProps} id={id} />
        </div>
    );
}
