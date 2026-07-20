import { Form, Head } from '@inertiajs/react';
import {
    CircleCheck,
    CircleX,
    Cloud,
    Clock3,
    GitBranch,
    HardDrive,
    LoaderCircle,
    Pause,
    Power,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { FormField, NativeSelect, PageSection } from '@/components/admin-form';
import { PageHeader } from '@/components/page-header';
import { SummaryCard } from '@/components/summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { isTranslationKey, useI18n } from '@/i18n';

type BackupDestination = {
    id: number;
    type: 'git' | 's3' | 'local';
    name: string;
    enabled: boolean;
    last_run: {
        status: 'queued' | 'running' | 'completed' | 'failed';
        ran_at: string | null;
        size: number | null;
    } | null;
};

type EncryptionMode = 'password' | 'keyfile';
type GitAuthentication = 'token' | 'ssh';

export default function DataProtectionIndex({
    destinations,
    summary,
}: {
    destinations: BackupDestination[];
    summary: {
        active: number;
        paused: number;
        failed: number;
    };
}) {
    const { t } = useI18n();

    return (
        <>
            <Head title={t('data_protection.title')} />
            <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('data_protection.eyebrow')}
                    title={t('data_protection.heading')}
                    description={t('data_protection.description')}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    <SummaryCard
                        icon={CircleCheck}
                        label={t('data_protection.summary.active')}
                        value={summary.active}
                        tone="success"
                    />
                    <SummaryCard
                        icon={Pause}
                        label={t('data_protection.summary.paused')}
                        value={summary.paused}
                        tone="neutral"
                    />
                    <SummaryCard
                        icon={CircleX}
                        label={t('data_protection.summary.failed')}
                        value={summary.failed}
                        tone="danger"
                    />
                </div>

                <PageSection
                    icon={ShieldCheck}
                    title={t('data_protection.destinations')}
                    description={t('data_protection.destinations_description')}
                >
                    <div className="grid gap-4 lg:grid-cols-3">
                        {destinations.map((destination) => (
                            <DestinationCard
                                key={destination.id}
                                destination={destination}
                            />
                        ))}
                        <S3DestinationForm />
                        <GitDestinationForm />
                        <LocalDestinationForm />
                    </div>
                </PageSection>
            </div>
        </>
    );
}

function DestinationCard({ destination }: { destination: BackupDestination }) {
    const { t, formatDateTime, formatNumber } = useI18n();
    const action = destination.type === 'git' ? 'mirror' : 'backup';
    const isRunning =
        destination.last_run?.status === 'queued' ||
        destination.last_run?.status === 'running';
    const DestinationIcon =
        destination.type === 'git'
            ? GitBranch
            : destination.type === 'local'
              ? HardDrive
              : Cloud;
    const StatusIcon =
        destination.last_run === null
            ? Clock3
            : destination.last_run.status === 'completed'
              ? CircleCheck
              : destination.last_run.status === 'failed'
                ? CircleX
                : LoaderCircle;
    const statusClass =
        destination.last_run?.status === 'completed'
            ? 'text-emerald-600'
            : destination.last_run?.status === 'failed'
              ? 'text-destructive'
              : 'text-muted-foreground';

    return (
        <Card className="gap-4 py-5">
            <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                            <DestinationIcon className="size-5" />
                        </span>
                        <CardTitle className="truncate text-base">
                            {destination.name}
                        </CardTitle>
                    </div>
                    <Badge
                        className={
                            destination.enabled
                                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : 'border-border bg-muted text-muted-foreground'
                        }
                        variant="outline"
                    >
                        {destination.enabled
                            ? t('common.active')
                            : t('data_protection.paused')}
                    </Badge>
                </div>
                <Badge variant="secondary" className="w-fit">
                    {t(`data_protection.destination_type.${destination.type}`)}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border bg-muted/35 p-3">
                    <StatusIcon
                        className={`mt-0.5 size-4 shrink-0 ${statusClass} ${isRunning ? 'animate-spin' : ''}`}
                    />
                    <div className="min-w-0">
                        <p className="text-sm font-medium">
                            {destination.last_run
                                ? translateRunStatus(
                                      destination.last_run.status,
                                      t,
                                  )
                                : t('data_protection.not_run')}
                        </p>
                        {destination.last_run?.ran_at && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {t('data_protection.last_run_at', {
                                    date: formatDateTime(
                                        destination.last_run.ran_at,
                                    ),
                                })}
                            </p>
                        )}
                        {destination.last_run?.size && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {t('data_protection.archive_size', {
                                    size: formatNumber(
                                        destination.last_run.size / 1024 / 1024,
                                        {
                                            maximumFractionDigits: 1,
                                        },
                                    ),
                                })}
                            </p>
                        )}
                    </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Form
                        action={`/data-protection/destinations/${destination.id}/${action}`}
                        method="post"
                        options={{ preserveScroll: true }}
                    >
                        {({ processing }) => (
                            <Button
                                className="w-full"
                                size="sm"
                                variant="outline"
                                disabled={
                                    processing ||
                                    !destination.enabled ||
                                    isRunning
                                }
                            >
                                {processing ? <Spinner /> : <DestinationIcon />}
                                {destination.type === 'git'
                                    ? t('data_protection.mirror')
                                    : t('data_protection.backup')}
                            </Button>
                        )}
                    </Form>
                    <Form
                        action={`/data-protection/destinations/${destination.id}`}
                        method="patch"
                        options={{ preserveScroll: true }}
                    >
                        {({ processing }) => (
                            <>
                                <input
                                    type="hidden"
                                    name="enabled"
                                    value={destination.enabled ? '0' : '1'}
                                />
                                <Button
                                    className="w-full"
                                    size="sm"
                                    variant="ghost"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : destination.enabled ? (
                                        <Pause />
                                    ) : (
                                        <Power />
                                    )}
                                    {destination.enabled
                                        ? t('data_protection.pause')
                                        : t('data_protection.activate')}
                                </Button>
                            </>
                        )}
                    </Form>
                </div>
            </CardContent>
        </Card>
    );
}

function S3DestinationForm() {
    const { t } = useI18n();
    const [encryptionMode, setEncryptionMode] =
        useState<EncryptionMode>('password');

    return (
        <Card className="gap-4 border-dashed py-5">
            <CardHeader>
                <CardTitle className="text-base">
                    {t('data_protection.new_s3')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form
                    action="/data-protection/destinations"
                    method="post"
                    resetOnSuccess
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="type" value="s3" />
                            <input type="hidden" name="enabled" value="1" />
                            <FormField
                                label={t('common.name')}
                                name="name"
                                maxLength={120}
                                required
                                error={errors.name}
                            />
                            <FormField
                                label={t('data_protection.s3_endpoint')}
                                name="config[endpoint]"
                                type="url"
                                maxLength={1000}
                                placeholder="https://s3.example.com"
                                error={errors['config.endpoint']}
                            />
                            <FormField
                                label={t('data_protection.s3_bucket')}
                                name="config[bucket]"
                                maxLength={255}
                                required
                                error={errors['config.bucket']}
                            />
                            <FormField
                                label={t('data_protection.s3_access_key')}
                                name="config[key]"
                                maxLength={1000}
                                required
                                autoComplete="username"
                                error={errors['config.key']}
                            />
                            <FormField
                                label={t('data_protection.s3_secret')}
                                name="config[secret]"
                                type="password"
                                maxLength={10000}
                                required
                                autoComplete="new-password"
                                error={errors['config.secret']}
                            />
                            <NativeSelect
                                label={t('data_protection.recovery')}
                                name="config[encryption_mode]"
                                value={encryptionMode}
                                onChange={(event) =>
                                    setEncryptionMode(
                                        event.target.value as EncryptionMode,
                                    )
                                }
                                options={[
                                    [
                                        'password',
                                        t('data_protection.recovery_password'),
                                    ],
                                    ['keyfile', t('data_protection.age_key')],
                                ]}
                                error={errors['config.encryption_mode']}
                            />
                            {encryptionMode === 'password' ? (
                                <FormField
                                    label={t(
                                        'data_protection.recovery_password_min',
                                    )}
                                    name="config[password]"
                                    type="password"
                                    minLength={16}
                                    maxLength={10000}
                                    required
                                    autoComplete="new-password"
                                    error={errors['config.password']}
                                />
                            ) : (
                                <FormField
                                    label={t('data_protection.age_recipient')}
                                    name="config[recipient]"
                                    placeholder="age1..."
                                    maxLength={62}
                                    required
                                    error={errors['config.recipient']}
                                />
                            )}
                            <Button className="w-full" disabled={processing}>
                                {processing && <Spinner />}
                                {t('data_protection.save_destination')}
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

function GitDestinationForm() {
    const { t } = useI18n();
    const [authentication, setAuthentication] =
        useState<GitAuthentication>('token');

    return (
        <Card className="gap-4 border-dashed py-5">
            <CardHeader>
                <CardTitle className="text-base">
                    {t('data_protection.new_git')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form
                    action="/data-protection/destinations"
                    method="post"
                    resetOnSuccess
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="type" value="git" />
                            <input type="hidden" name="enabled" value="1" />
                            <FormField
                                label={t('common.name')}
                                name="name"
                                maxLength={120}
                                required
                                error={errors.name}
                            />
                            <NativeSelect
                                label={t('data_protection.authentication')}
                                name="config[auth_type]"
                                value={authentication}
                                onChange={(event) =>
                                    setAuthentication(
                                        event.target.value as GitAuthentication,
                                    )
                                }
                                options={[
                                    [
                                        'token',
                                        t(
                                            'data_protection.https_token_authentication',
                                        ),
                                    ],
                                    [
                                        'ssh',
                                        t('data_protection.ssh_private_key'),
                                    ],
                                ]}
                                error={errors['config.auth_type']}
                            />
                            <FormField
                                label={t('data_protection.repository_url')}
                                name="config[url]"
                                maxLength={1000}
                                required
                                placeholder="git@github.com:example/private-backup.git"
                                error={errors['config.url']}
                            />
                            {authentication === 'token' ? (
                                <FormField
                                    label={t('data_protection.https_token')}
                                    name="config[token]"
                                    type="password"
                                    maxLength={10000}
                                    required
                                    autoComplete="new-password"
                                    error={errors['config.token']}
                                />
                            ) : (
                                <div className="space-y-1.5">
                                    <Label htmlFor="git-private-key">
                                        {t('data_protection.private_key')}
                                    </Label>
                                    <textarea
                                        id="git-private-key"
                                        name="config[private_key]"
                                        rows={5}
                                        maxLength={50000}
                                        required
                                        spellCheck={false}
                                        aria-invalid={
                                            errors['config.private_key']
                                                ? true
                                                : undefined
                                        }
                                        className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                                        placeholder={t(
                                            'data_protection.private_key',
                                        )}
                                    />
                                    {errors['config.private_key'] ? (
                                        <p className="text-xs text-destructive">
                                            {errors['config.private_key']}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            {t('data_protection.mode_hint')}
                                        </p>
                                    )}
                                </div>
                            )}
                            <label className="flex items-start gap-2 text-xs text-muted-foreground">
                                <input
                                    className="mt-0.5"
                                    type="checkbox"
                                    name="config[confirm_private]"
                                    value="1"
                                    required
                                />
                                {t('data_protection.private_confirmation')}
                            </label>
                            {errors['config.confirm_private'] && (
                                <p className="text-xs text-destructive">
                                    {errors['config.confirm_private']}
                                </p>
                            )}
                            <Button className="w-full" disabled={processing}>
                                {processing && <Spinner />}
                                {t('data_protection.save_mirror')}
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

function LocalDestinationForm() {
    const { t } = useI18n();

    return (
        <Card className="gap-4 border-dashed py-5">
            <CardHeader>
                <CardTitle className="text-base">
                    {t('data_protection.local_backup')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form
                    action="/data-protection/destinations"
                    method="post"
                    resetOnSuccess
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="type" value="local" />
                            <input type="hidden" name="enabled" value="1" />
                            <input
                                type="hidden"
                                name="config[encryption_mode]"
                                value="password"
                            />
                            <FormField
                                label={t('common.name')}
                                name="name"
                                maxLength={120}
                                required
                                placeholder={t('data_protection.local_copy')}
                                error={errors.name}
                            />
                            <FormField
                                label={t(
                                    'data_protection.recovery_password_min',
                                )}
                                name="config[password]"
                                type="password"
                                minLength={16}
                                maxLength={10000}
                                required
                                autoComplete="new-password"
                                error={errors['config.password']}
                            />
                            <Button className="w-full" disabled={processing}>
                                {processing && <Spinner />}
                                {t('data_protection.save_destination')}
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

function translateRunStatus(
    status: string,
    t: ReturnType<typeof useI18n>['t'],
): string {
    const key = `data_protection.run_status.${status}`;

    return isTranslationKey(key) ? t(key) : status;
}
