import { Form, Head, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';
import { useI18n } from '@/i18n';
/* @chisel-email-verification */

type PageProps = {
    auth: Auth;
};

export default function Profile() {
    const { auth } = usePage<PageProps>().props;
    const { t } = useI18n();

    return (
        <>
            <Head title={t('profile.title')} />

            <h1 className="sr-only">{t('profile.title')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('settings.profile')}
                    description={t('profile.description')}
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('auth.name')}</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder={t('auth.full_name')}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                                <p className="font-medium">{auth.user.email}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('profile.email_admin_only')}
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label>{t('common.language')}</Label>
                                <LanguageSelector className="w-fit" />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    {t('common.save')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'profile.title',
            href: edit(),
        },
    ],
};
