import { Form, Head, usePage } from '@inertiajs/react';
import {
    Building2,
    Check,
    Globe2,
    Image,
    ShieldAlert,
    Timer,
} from 'lucide-react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { isLocaleCode, useI18n } from '@/i18n';

type Props = {
    organization: {
        name?: string;
        locale?: string;
        timezone?: string;
        domain?: string | null;
        canonical_url?: string | null;
        settings?: {
            default_backup_interval?: number;
            default_timeout?: number;
        } | null;
    } | null;
    timezones: string[];
};

export default function Setup({ organization, timezones }: Props) {
    const { locale } = usePage().props;
    const { t } = useI18n();
    const selectedLocale = isLocaleCode(locale) ? locale : 'en';
    const [interval, setIntervalValue] = useState(
        organization?.settings?.default_backup_interval ?? 3600,
    );
    const [timeout, setTimeoutValue] = useState(
        organization?.settings?.default_timeout ?? 20,
    );
    const intervalRisk =
        interval < 900 ? 'critical' : interval < 3600 ? 'warning' : 'normal';
    const timeoutRisk =
        timeout > 180 ? 'critical' : timeout > 60 ? 'warning' : 'normal';

    return (
        <>
            <Head title={t('setup.head_title')} />
            <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-[#07111f]">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="grid size-11 place-items-center rounded-xl bg-emerald-500 text-slate-950">
                                <AppLogoIcon className="size-8" />
                            </span>
                            <div>
                                <p className="font-semibold">NetKeep</p>
                                <p className="text-sm text-muted-foreground">
                                    {t('setup.assistant')}
                                </p>
                            </div>
                        </div>
                        <LanguageSelector />
                    </div>

                    <div className="overflow-hidden rounded-2xl border bg-background shadow-xl shadow-slate-950/5">
                        <div className="border-b px-6 py-7 sm:px-8">
                            <p className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">
                                {t('setup.single_step')}
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold">
                                {t('setup.identify')}
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {t('setup.introduction')}
                            </p>
                        </div>

                        <Form
                            action="/setup"
                            method="post"
                            encType="multipart/form-data"
                            disableWhileProcessing
                            className="space-y-7 p-6 sm:p-8"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <input
                                        type="hidden"
                                        name="locale"
                                        value={selectedLocale}
                                    />
                                    <div className="rounded-xl border border-red-500/50 bg-red-500/5 p-4 text-sm">
                                        <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-300">
                                            <ShieldAlert className="size-4" />
                                            {t('setup.collection_security')}
                                        </p>
                                        <p className="mt-2 leading-6 text-muted-foreground">
                                            {t(
                                                'setup.collection_security_description',
                                            )}
                                        </p>
                                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                            <SetupRisk
                                                label={t(
                                                    'setup.collection_interval',
                                                )}
                                                level={intervalRisk}
                                                t={t}
                                            />
                                            <SetupRisk
                                                label={t('setup.timeout')}
                                                level={timeoutRisk}
                                                t={t}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="name">
                                                <Building2 className="size-4" />
                                                {t('setup.organization')}
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                defaultValue={
                                                    organization?.name
                                                }
                                                placeholder={t(
                                                    'setup.organization_placeholder',
                                                )}
                                                required
                                                autoFocus
                                            />
                                            <InputError message={errors.name} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="timezone">
                                                {t('setup.timezone')}
                                            </Label>
                                            <select
                                                id="timezone"
                                                name="timezone"
                                                defaultValue={
                                                    organization?.timezone ??
                                                    'America/Sao_Paulo'
                                                }
                                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                            >
                                                {timezones.map((timezone) => (
                                                    <option
                                                        key={timezone}
                                                        value={timezone}
                                                    >
                                                        {timezone}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.timezone}
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="canonical_url">
                                                <Globe2 className="size-4" />
                                                {t('setup.canonical_url')}
                                            </Label>
                                            <Input
                                                id="canonical_url"
                                                name="canonical_url"
                                                type="url"
                                                defaultValue={
                                                    organization?.canonical_url ??
                                                    ''
                                                }
                                                placeholder="https://netkeep.example.com"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {t('setup.canonical_url_hint')}
                                            </p>
                                            <InputError
                                                message={errors.canonical_url}
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="domain">
                                                <Globe2 className="size-4" />
                                                {t('setup.domain')}
                                            </Label>
                                            <Input
                                                id="domain"
                                                name="domain"
                                                defaultValue={
                                                    organization?.domain ?? ''
                                                }
                                                placeholder="netkeep.seudominio.com.br"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {t('setup.domain_hint')}
                                            </p>
                                            <InputError
                                                message={errors.domain}
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="logo">
                                                <Image className="size-4" />
                                                {t('setup.logo')}
                                            </Label>
                                            <Input
                                                id="logo"
                                                name="logo"
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                            />
                                            <InputError message={errors.logo} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="default_backup_interval">
                                                <Timer className="size-4" />
                                                {t('setup.collection_interval')}
                                            </Label>
                                            <Input
                                                id="default_backup_interval"
                                                name="default_backup_interval"
                                                type="number"
                                                min="300"
                                                max="604800"
                                                defaultValue={interval}
                                                onChange={(event) =>
                                                    setIntervalValue(
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                required
                                            />
                                            <InputError
                                                message={
                                                    errors.default_backup_interval
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="default_timeout">
                                                {t('setup.timeout')}
                                            </Label>
                                            <Input
                                                id="default_timeout"
                                                name="default_timeout"
                                                type="number"
                                                min="5"
                                                max="300"
                                                defaultValue={timeout}
                                                onChange={(event) =>
                                                    setTimeoutValue(
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                required
                                            />
                                            <InputError
                                                message={errors.default_timeout}
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="full_backup_retention_days">
                                                {t('setup.retention')}
                                            </Label>
                                            <Input
                                                id="full_backup_retention_days"
                                                name="full_backup_retention_days"
                                                type="number"
                                                min="0"
                                                max="3650"
                                                defaultValue="0"
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {t('setup.retention_hint')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-emerald-600/20 bg-emerald-500/5 p-4 text-sm">
                                        <p className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-300">
                                            <Check className="size-4" />
                                            {t('setup.no_config_file')}
                                        </p>
                                        <p className="mt-1 pl-6 text-muted-foreground">
                                            {t('setup.postgres_storage')}
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full"
                                    >
                                        {processing && <Spinner />}
                                        {t('setup.complete')}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </div>
                </div>
            </main>
        </>
    );
}

function SetupRisk({
    label,
    level,
    t,
}: {
    label: string;
    level: 'normal' | 'warning' | 'critical';
    t: ReturnType<typeof useI18n>['t'];
}) {
    const styles = {
        normal: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        warning:
            'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        critical:
            'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    };

    return (
        <div className={`rounded-lg border p-3 ${styles[level]}`}>
            <p className="text-xs">{label}</p>
            <p className="mt-1 font-semibold">
                {t(`risk.${level}` as Parameters<typeof t>[0])}
            </p>
        </div>
    );
}
