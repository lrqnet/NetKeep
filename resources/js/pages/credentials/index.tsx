import { Form, Head, router } from '@inertiajs/react';
import { KeyRound, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n';

type Profile = {
    id: number;
    name: string;
    username: string | null;
    notes: string | null;
    devices_count: number;
    has_password: boolean;
    has_enable: boolean;
    has_private_key: boolean;
    updated_at: string;
};

export default function CredentialsIndex({
    profiles,
}: {
    profiles: Profile[];
}) {
    const { t, formatNumber } = useI18n();

    return (
        <>
            <Head title={t('credentials.title')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('credentials.secure_access')}
                    title={t('credentials.profiles')}
                    description={t('credentials.description')}
                />

                <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
                    <div className="grid gap-4 md:grid-cols-2">
                        {profiles.length === 0 ? (
                            <Card className="md:col-span-2">
                                <CardContent className="py-10 text-center">
                                    <KeyRound className="mx-auto size-9 text-muted-foreground" />
                                    <p className="mt-4 font-medium">
                                        {t('credentials.empty')}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {t('credentials.empty_hint')}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            profiles.map((profile) => (
                                <Card key={profile.id} className="gap-4 py-5">
                                    <CardHeader className="flex-row items-start justify-between">
                                        <div>
                                            <CardTitle className="text-base">
                                                {profile.name}
                                            </CardTitle>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {profile.username ??
                                                    t(
                                                        'credentials.no_username',
                                                    )}
                                            </p>
                                        </div>
                                        <span className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                            <ShieldCheck className="size-4" />
                                        </span>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.has_password && (
                                                <Badge variant="secondary">
                                                    {t(
                                                        'credentials.password_badge',
                                                    )}
                                                </Badge>
                                            )}
                                            {profile.has_enable && (
                                                <Badge variant="secondary">
                                                    enable
                                                </Badge>
                                            )}
                                            {profile.has_private_key && (
                                                <Badge variant="secondary">
                                                    {t(
                                                        'credentials.ssh_key_badge',
                                                    )}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                                            <span>
                                                {t('credentials.device_count', {
                                                    total: formatNumber(
                                                        profile.devices_count,
                                                    ),
                                                })}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title={t('common.remove')}
                                                disabled={
                                                    profile.devices_count > 0
                                                }
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            t(
                                                                'credentials.remove_confirm',
                                                                {
                                                                    name: profile.name,
                                                                },
                                                            ),
                                                        )
                                                    ) {
                                                        router.delete(
                                                            `/credentials/${profile.id}`,
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        );
                                                    }
                                                }}
                                            >
                                                <Trash2 />
                                            </Button>
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
                                {t('credentials.new')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form
                                action="/credentials"
                                method="post"
                                resetOnSuccess
                                options={{ preserveScroll: true }}
                                className="space-y-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <Field
                                            label={t(
                                                'credentials.profile_name',
                                            )}
                                            name="name"
                                            placeholder={t(
                                                'credentials.profile_placeholder',
                                            )}
                                            error={errors.name}
                                            required
                                        />
                                        <Field
                                            label={t('credentials.username')}
                                            name="username"
                                            autoComplete="off"
                                            error={errors.username}
                                        />
                                        <Field
                                            label={t('auth.password')}
                                            name="password"
                                            type="password"
                                            autoComplete="new-password"
                                            error={errors.password}
                                        />
                                        <Field
                                            label="Enable secret"
                                            name="enable_secret"
                                            type="password"
                                            autoComplete="new-password"
                                            error={errors.enable_secret}
                                        />
                                        <div className="space-y-1.5">
                                            <Label htmlFor="private_key">
                                                {t('credentials.private_key')}
                                            </Label>
                                            <textarea
                                                id="private_key"
                                                name="private_key"
                                                rows={5}
                                                spellCheck={false}
                                                className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                                                placeholder={t(
                                                    'credentials.private_key',
                                                )}
                                            />
                                            {errors.private_key && (
                                                <p className="text-xs text-destructive">
                                                    {errors.private_key}
                                                </p>
                                            )}
                                        </div>
                                        <Field
                                            label={t(
                                                'credentials.key_passphrase',
                                            )}
                                            name="private_key_passphrase"
                                            type="password"
                                            autoComplete="new-password"
                                            error={
                                                errors.private_key_passphrase
                                            }
                                        />
                                        <Button
                                            className="w-full"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <KeyRound />
                                            )}
                                            {t('credentials.save_encrypted')}
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

function Field({
    label,
    error,
    ...props
}: React.ComponentProps<typeof Input> & {
    label: string;
    error?: string;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={props.name}>{label}</Label>
            <Input id={props.name} {...props} />
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
