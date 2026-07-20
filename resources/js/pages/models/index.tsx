import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Braces,
    CheckCircle2,
    Code2,
    Plus,
    Rocket,
} from 'lucide-react';
import { useId } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n';

type Model = {
    id: number;
    name: string;
    slug: string;
    source: 'guided' | 'raw';
    version: number;
    status: string;
    published_at: string | null;
    last_validation_error: string | null;
    last_test_status: string | null;
    last_test_message: string | null;
    author?: { name: string };
};

export default function ModelsIndex({
    models,
    warning,
    catalog,
    testDevices,
    rawEnabled,
    canManageRaw,
    reviewedDrivers,
    safeCommands,
    sessionCommands,
    logoutCommands,
}: {
    models: Model[];
    warning: string;
    catalog: { version: string; models: string[] };
    testDevices: Array<{
        id: number;
        name: string;
        oxidized_model: string;
    }>;
    rawEnabled: boolean;
    canManageRaw: boolean;
    reviewedDrivers: string[];
    safeCommands: Record<string, string[]>;
    sessionCommands: string[];
    logoutCommands: string[];
}) {
    const { t, formatNumber } = useI18n();
    const filtersId = useId();
    const rubyUploadId = useId();
    const form = useForm({
        name: '',
        slug: '',
        source: 'guided' as 'guided' | 'raw',
        base_model: '',
        ruby_source:
            "class MyModel < Oxidized::Model\n  prompt /^.*[#>]\\s?$/\n  cmd 'show running-config'\nend\n",
        definition: {
            prompt: '[>#]',
            comment: '# ',
            post_login: 'terminal length 0',
            enable: false,
            commands: 'show running-config',
            filters: '',
            logout: 'exit',
        },
    });

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            definition: {
                ...data.definition,
                commands: data.definition.commands
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
                filters: data.definition.filters
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
            },
        }));
        form.post('/models', {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    }

    return (
        <>
            <Head title={t('models.title')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('models.extensibility')}
                    title={t('models.title')}
                    description={t('models.description', {
                        total: formatNumber(catalog.models.length),
                        version: catalog.version,
                    })}
                />

                <div
                    className={`flex gap-3 rounded-xl border p-4 text-sm ${
                        rawEnabled
                            ? 'border-red-500/40 bg-red-500/10'
                            : 'border-amber-500/25 bg-amber-500/5'
                    }`}
                >
                    <AlertTriangle
                        className={`mt-0.5 size-5 shrink-0 ${
                            rawEnabled ? 'text-red-600' : 'text-amber-600'
                        }`}
                    />
                    <div>
                        <p className="font-medium">
                            {rawEnabled
                                ? t('models.raw_mode_enabled')
                                : t('models.safe_mode_active')}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                            {rawEnabled
                                ? t('models.raw_mode_warning')
                                : t('models.safe_mode_description')}
                        </p>
                        {rawEnabled && (
                            <p className="mt-2 font-medium text-red-700 dark:text-red-300">
                                {warning}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid items-start gap-6 xl:grid-cols-[1fr_430px]">
                    <div className="grid gap-4 md:grid-cols-2">
                        {models.length === 0 ? (
                            <Card className="md:col-span-2">
                                <CardContent className="py-12 text-center">
                                    <Braces className="mx-auto size-9 text-muted-foreground" />
                                    <p className="mt-4 font-medium">
                                        {t('models.official_only')}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {t('models.official_only_hint')}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            models.map((model) => (
                                <Card key={model.id} className="gap-4 py-5">
                                    <CardHeader className="flex-row items-start justify-between">
                                        <div>
                                            <CardTitle className="text-base">
                                                {model.name}
                                            </CardTitle>
                                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                {model.slug}.rb · v
                                                {model.version}
                                            </p>
                                        </div>
                                        <Badge
                                            className={
                                                model.status === 'published'
                                                    ? 'bg-emerald-600'
                                                    : model.status === 'error'
                                                      ? 'bg-red-600'
                                                      : ''
                                            }
                                        >
                                            {model.status === 'published'
                                                ? t('model_status.published')
                                                : model.status === 'error'
                                                  ? t('model_status.error')
                                                  : t('model_status.draft')}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        {model.last_validation_error && (
                                            <p className="rounded-md bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                                                {model.last_validation_error}
                                            </p>
                                        )}
                                        {model.last_test_message && (
                                            <p
                                                className={`mt-3 rounded-md p-3 text-xs ${
                                                    model.last_test_status ===
                                                    'passed'
                                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                        : 'bg-red-500/10 text-red-700 dark:text-red-300'
                                                }`}
                                            >
                                                {t('models.test_message', {
                                                    message:
                                                        model.last_test_message,
                                                })}
                                            </p>
                                        )}
                                        <div className="mt-4 flex items-center justify-between border-t pt-4">
                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                {model.source === 'guided' ? (
                                                    <CheckCircle2 className="size-3.5" />
                                                ) : (
                                                    <Code2 className="size-3.5" />
                                                )}
                                                {model.source === 'guided'
                                                    ? t('models.guided')
                                                    : t('models.advanced_ruby')}
                                            </span>
                                            <div className="flex gap-2">
                                                {testDevices.some(
                                                    (device) =>
                                                        device.oxidized_model ===
                                                        model.slug,
                                                ) && (
                                                    <select
                                                        aria-label={t(
                                                            'models.test_device_label',
                                                            {
                                                                name: model.name,
                                                            },
                                                        )}
                                                        defaultValue=""
                                                        className="h-8 max-w-36 rounded-md border bg-background px-2 text-xs"
                                                        onChange={(event) => {
                                                            if (
                                                                event
                                                                    .currentTarget
                                                                    .value
                                                            ) {
                                                                router.post(
                                                                    `/models/${model.id}/test`,
                                                                    {
                                                                        device_id:
                                                                            event
                                                                                .currentTarget
                                                                                .value,
                                                                    },
                                                                    {
                                                                        preserveScroll: true,
                                                                    },
                                                                );
                                                                event.currentTarget.value =
                                                                    '';
                                                            }
                                                        }}
                                                    >
                                                        <option value="">
                                                            {t(
                                                                'models.test_on',
                                                            )}
                                                        </option>
                                                        {testDevices
                                                            .filter(
                                                                (device) =>
                                                                    device.oxidized_model ===
                                                                    model.slug,
                                                            )
                                                            .map((device) => (
                                                                <option
                                                                    key={
                                                                        device.id
                                                                    }
                                                                    value={
                                                                        device.id
                                                                    }
                                                                >
                                                                    {
                                                                        device.name
                                                                    }
                                                                </option>
                                                            ))}
                                                    </select>
                                                )}
                                                {model.status !== 'published' &&
                                                    (model.source !== 'raw' ||
                                                        canManageRaw) && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                router.post(
                                                                    `/models/${model.id}/publish`,
                                                                    {},
                                                                    {
                                                                        preserveScroll: true,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <Rocket />
                                                            {t(
                                                                'models.publish',
                                                            )}
                                                        </Button>
                                                    )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    <Card className="sticky top-4 gap-4 py-5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Plus className="size-4 text-emerald-600" />
                                {t('models.new')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <Field
                                    label={t('common.name')}
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData(
                                            'name',
                                            event.currentTarget.value,
                                        )
                                    }
                                    error={form.errors.name}
                                    required
                                />
                                <Field
                                    label={t('models.identifier')}
                                    value={form.data.slug}
                                    onChange={(event) =>
                                        form.setData(
                                            'slug',
                                            event.currentTarget.value,
                                        )
                                    }
                                    placeholder="meu_modelo"
                                    error={form.errors.slug}
                                />
                                <div
                                    className={`grid rounded-lg bg-muted p-1 ${
                                        canManageRaw
                                            ? 'grid-cols-2'
                                            : 'grid-cols-1'
                                    }`}
                                >
                                    {(
                                        [
                                            [
                                                'guided',
                                                t('models.guided_short'),
                                            ],
                                            ...(canManageRaw
                                                ? [
                                                      [
                                                          'raw',
                                                          t(
                                                              'models.advanced_ruby',
                                                          ),
                                                      ],
                                                  ]
                                                : []),
                                        ] as Array<['guided' | 'raw', string]>
                                    ).map(([value, label]) => (
                                        <button
                                            type="button"
                                            key={value}
                                            onClick={() =>
                                                form.setData(
                                                    'source',
                                                    value as 'guided' | 'raw',
                                                )
                                            }
                                            className={`rounded-md px-3 py-2 text-sm font-medium ${
                                                form.data.source === value
                                                    ? 'bg-background shadow-sm'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {form.data.source === 'guided' ? (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="base-model">
                                                {t('models.reviewed_driver')}
                                            </Label>
                                            <select
                                                id="base-model"
                                                required
                                                value={form.data.base_model}
                                                onChange={(event) => {
                                                    const baseModel =
                                                        event.currentTarget
                                                            .value;
                                                    form.setData((data) => ({
                                                        ...data,
                                                        base_model: baseModel,
                                                        definition: {
                                                            ...data.definition,
                                                            commands: (
                                                                safeCommands[
                                                                    baseModel
                                                                ] ?? []
                                                            ).join('\n'),
                                                        },
                                                    }));
                                                }}
                                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                            >
                                                <option value="">
                                                    {t(
                                                        'models.select_reviewed_driver',
                                                    )}
                                                </option>
                                                {reviewedDrivers.map(
                                                    (driver) => (
                                                        <option
                                                            key={driver}
                                                            value={driver}
                                                        >
                                                            {driver}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            {form.errors.base_model && (
                                                <p className="text-xs text-destructive">
                                                    {form.errors.base_model}
                                                </p>
                                            )}
                                        </div>
                                        <Field
                                            label={t(
                                                'models.prompt_expression',
                                            )}
                                            value={form.data.definition.prompt}
                                            onChange={(event) =>
                                                form.setData('definition', {
                                                    ...form.data.definition,
                                                    prompt: event.currentTarget
                                                        .value,
                                                })
                                            }
                                        />
                                        <Field
                                            label={t('models.comment_prefix')}
                                            value={form.data.definition.comment}
                                            onChange={(event) =>
                                                form.setData('definition', {
                                                    ...form.data.definition,
                                                    comment:
                                                        event.currentTarget
                                                            .value,
                                                })
                                            }
                                        />
                                        <SelectField
                                            label={t(
                                                'models.post_login_command',
                                            )}
                                            value={
                                                form.data.definition.post_login
                                            }
                                            options={sessionCommands}
                                            onChange={(value) =>
                                                form.setData('definition', {
                                                    ...form.data.definition,
                                                    post_login: value,
                                                })
                                            }
                                        />
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    form.data.definition.enable
                                                }
                                                onChange={(event) =>
                                                    form.setData('definition', {
                                                        ...form.data.definition,
                                                        enable: event
                                                            .currentTarget
                                                            .checked,
                                                    })
                                                }
                                            />
                                            {t('models.use_enable')}
                                        </label>
                                        <div className="space-y-1.5">
                                            <Label>
                                                {t('models.commands')}
                                            </Label>
                                            <div className="rounded-md border bg-muted/30 p-3">
                                                {form.data.base_model ? (
                                                    (
                                                        safeCommands[
                                                            form.data.base_model
                                                        ] ?? []
                                                    ).map((command) => (
                                                        <label
                                                            key={command}
                                                            className="flex items-center gap-2 font-mono text-xs"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={form.data.definition.commands
                                                                    .split('\n')
                                                                    .includes(
                                                                        command,
                                                                    )}
                                                                onChange={(
                                                                    event,
                                                                ) => {
                                                                    const current =
                                                                        form.data.definition.commands
                                                                            .split(
                                                                                '\n',
                                                                            )
                                                                            .filter(
                                                                                Boolean,
                                                                            );
                                                                    const next =
                                                                        event
                                                                            .currentTarget
                                                                            .checked
                                                                            ? [
                                                                                  ...current,
                                                                                  command,
                                                                              ]
                                                                            : current.filter(
                                                                                  (
                                                                                      item,
                                                                                  ) =>
                                                                                      item !==
                                                                                      command,
                                                                              );
                                                                    form.setData(
                                                                        'definition',
                                                                        {
                                                                            ...form
                                                                                .data
                                                                                .definition,
                                                                            commands:
                                                                                next.join(
                                                                                    '\n',
                                                                                ),
                                                                        },
                                                                    );
                                                                }}
                                                            />
                                                            {command}
                                                        </label>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">
                                                        {t(
                                                            'models.select_driver_first',
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                            {(
                                                form.errors as Record<
                                                    string,
                                                    string
                                                >
                                            )['definition.commands'] && (
                                                <p className="text-xs text-destructive">
                                                    {
                                                        (
                                                            form.errors as Record<
                                                                string,
                                                                string
                                                            >
                                                        )['definition.commands']
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor={filtersId}>
                                                {t('models.filters')}
                                            </Label>
                                            <textarea
                                                id={filtersId}
                                                value={
                                                    form.data.definition.filters
                                                }
                                                onChange={(event) =>
                                                    form.setData('definition', {
                                                        ...form.data.definition,
                                                        filters:
                                                            event.currentTarget
                                                                .value,
                                                    })
                                                }
                                                rows={3}
                                                placeholder="^Building configuration.*$"
                                                className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                                            />
                                        </div>
                                        <SelectField
                                            label={t('models.logout_command')}
                                            value={form.data.definition.logout}
                                            options={logoutCommands}
                                            onChange={(value) =>
                                                form.setData('definition', {
                                                    ...form.data.definition,
                                                    logout: value,
                                                })
                                            }
                                        />
                                    </>
                                ) : (
                                    <div className="space-y-1.5">
                                        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-800 dark:text-red-200">
                                            {t('models.raw_mode_warning')}
                                        </div>
                                        <Label htmlFor={rubyUploadId}>
                                            {t('models.ruby_file')}
                                        </Label>
                                        <Input
                                            id={rubyUploadId}
                                            type="file"
                                            accept=".rb,text/plain"
                                            onChange={async (event) => {
                                                const file =
                                                    event.currentTarget
                                                        .files?.[0];

                                                if (file) {
                                                    form.setData(
                                                        'ruby_source',
                                                        await file.text(),
                                                    );
                                                }
                                            }}
                                        />
                                        <textarea
                                            aria-label={t('models.ruby_file')}
                                            value={form.data.ruby_source}
                                            onChange={(event) =>
                                                form.setData(
                                                    'ruby_source',
                                                    event.currentTarget.value,
                                                )
                                            }
                                            rows={14}
                                            spellCheck={false}
                                            className="w-full rounded-md border bg-[#07111f] px-3 py-3 font-mono text-xs leading-5 text-slate-100"
                                        />
                                        {form.errors.ruby_source && (
                                            <p className="text-xs text-destructive">
                                                {form.errors.ruby_source}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <Button
                                    className="w-full"
                                    disabled={form.processing}
                                >
                                    {form.processing ? <Spinner /> : <Braces />}
                                    {t('models.save_draft')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function SelectField({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}) {
    const id = useId();

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <select
                id={id}
                value={value}
                onChange={(event) => onChange(event.currentTarget.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
                {options.map((option) => (
                    <option key={option || 'empty'} value={option}>
                        {option || '—'}
                    </option>
                ))}
            </select>
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
    const id = useId();

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input {...props} id={id} />
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
