import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/register';
import { useI18n } from '@/i18n';
import {
    limitInputLength,
    normalizeEmailInput,
} from '@/lib/input-normalization';

type Props = {
    inputLimits: {
        name: number;
        email: number;
        password: number;
    };
    passwordRules: string;
};

export default function Register({ inputLimits, passwordRules }: Props) {
    const { t } = useI18n();

    return (
        <>
            <Head title={t('auth.create_owner_head')} />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="installation_token">
                                    {t('auth.installation_token')}
                                </Label>
                                <PasswordInput
                                    id="installation_token"
                                    required
                                    tabIndex={1}
                                    autoComplete="off"
                                    name="installation_token"
                                    maxLength={128}
                                    placeholder={t(
                                        'auth.installation_token_placeholder',
                                    )}
                                />
                                <p className="text-xs leading-5 text-muted-foreground">
                                    {t('auth.installation_token_hint')}
                                </p>
                                <InputError
                                    message={errors.installation_token}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('auth.name')}</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={2}
                                    autoComplete="name"
                                    name="name"
                                    maxLength={inputLimits.name}
                                    onInput={(event) =>
                                        limitInputLength(
                                            event,
                                            inputLimits.name,
                                        )
                                    }
                                    placeholder={t('auth.full_name')}
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('auth.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={3}
                                    autoComplete="email"
                                    name="email"
                                    inputMode="email"
                                    maxLength={inputLimits.email}
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    onInput={(event) =>
                                        normalizeEmailInput(
                                            event,
                                            inputLimits.email,
                                        )
                                    }
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    {t('auth.password')}
                                </Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password"
                                    maxLength={inputLimits.password}
                                    onInput={(event) =>
                                        limitInputLength(
                                            event,
                                            inputLimits.password,
                                        )
                                    }
                                    placeholder={t('auth.strong_password')}
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    {t('auth.confirm_password')}
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    maxLength={inputLimits.password}
                                    onInput={(event) =>
                                        limitInputLength(
                                            event,
                                            inputLimits.password,
                                        )
                                    }
                                    placeholder={t('auth.repeat_password')}
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={6}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                {t('auth.create_owner')}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'auth.create_owner_title',
    description: 'auth.create_owner_description',
};
