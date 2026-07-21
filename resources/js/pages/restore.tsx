import { Form, Head } from '@inertiajs/react';
import { FileLock2, ShieldAlert, Terminal } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n';

export default function Restore({
    authenticated,
    requestUuid,
}: {
    authenticated: boolean;
    requestUuid: string | null;
}) {
    const { t } = useI18n();
    const command = requestUuid
        ? `docker compose --profile recovery run --rm recovery php artisan netkeep:restore prepare --web-request=${requestUuid}`
        : null;

    return (
        <>
            <Head title={t('restore.title')} />
            <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-[#07111f]">
                <div className="mx-auto max-w-2xl space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="grid size-11 place-items-center rounded-xl bg-emerald-500 text-slate-950">
                                <AppLogoIcon className="size-8" />
                            </span>
                            <div>
                                <p className="font-semibold">NetKeep</p>
                                <p className="text-sm text-muted-foreground">
                                    {t('restore.title')}
                                </p>
                            </div>
                        </div>
                        <LanguageSelector />
                    </div>

                    <Card className="border-red-500/40">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                                <ShieldAlert className="size-5" />
                                {t('restore.warning_title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm leading-6 text-muted-foreground">
                            {t('restore.warning')}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileLock2 className="size-5 text-emerald-600" />
                                {t('restore.stage_archive')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form
                                action="/restore"
                                method="post"
                                encType="multipart/form-data"
                                className="space-y-5"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        {!authenticated && (
                                            <div className="space-y-2">
                                                <Label htmlFor="installation_token">
                                                    {t(
                                                        'restore.installation_token',
                                                    )}
                                                </Label>
                                                <Input
                                                    id="installation_token"
                                                    name="installation_token"
                                                    type="password"
                                                    maxLength={128}
                                                    required
                                                    autoComplete="off"
                                                />
                                                <InputError
                                                    message={
                                                        errors.installation_token
                                                    }
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="archive">
                                                {t('restore.archive')}
                                            </Label>
                                            <Input
                                                id="archive"
                                                name="archive"
                                                type="file"
                                                accept=".nkb,.age"
                                                required
                                            />
                                            <InputError
                                                message={errors.archive}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">
                                                {t('restore.password')}
                                            </Label>
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                minLength={16}
                                                maxLength={10000}
                                                autoComplete="off"
                                            />
                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="identity">
                                                {t('restore.identity')}
                                            </Label>
                                            <Input
                                                id="identity"
                                                name="identity"
                                                type="file"
                                            />
                                            <InputError
                                                message={errors.identity}
                                            />
                                        </div>
                                        <Button
                                            className="w-full"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <FileLock2 />
                                            )}
                                            {t('restore.stage')}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>

                    {command && (
                        <Card className="border-emerald-600/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Terminal className="size-5 text-emerald-600" />
                                    {t('restore.request_ready')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    {t('restore.run_locally')}
                                </p>
                                <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
                                    <code>{command}</code>
                                </pre>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </>
    );
}
