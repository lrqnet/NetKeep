import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
/* @chisel-registration */
import { register } from '@/routes';
/* @end-chisel-registration */
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { useI18n } from '@/i18n';
import {
    limitInputLength,
    normalizeEmailInput,
} from '@/lib/input-normalization';
/* @chisel-passkeys */
import PasskeyVerify from '@/components/passkey-verify';
/* @end-chisel-passkeys */

type Props = {
    status?: string;
    canRegister: boolean;
    canResetPassword: boolean;
    inputLimits: {
        email: number;
        password: number;
    };
};

export default function Login({
    status,
    canRegister,
    canResetPassword,
    inputLimits,
}: Props) {
    const { t } = useI18n();

    return (
        <>
            <Head title={t('auth.login_head')} />

            {/* @chisel-passkeys */}
            <PasskeyVerify />
            {/* @end-chisel-passkeys */}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('auth.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
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
                                <div className="flex items-center">
                                    <Label htmlFor="password">
                                        {t('auth.password')}
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            {t('auth.forgot_password')}
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    maxLength={inputLimits.password}
                                    onInput={(event) =>
                                        limitInputLength(
                                            event,
                                            inputLimits.password,
                                        )
                                    }
                                    placeholder={t('auth.password')}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">
                                    {t('auth.remember_me')}
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                {t('auth.sign_in')}
                            </Button>
                        </div>

                        {/* @chisel-registration */}
                        {canRegister && (
                            <div className="text-center text-sm text-muted-foreground">
                                {t('auth.no_account')}{' '}
                                <TextLink href={register()} tabIndex={5}>
                                    {t('auth.sign_up')}
                                </TextLink>
                            </div>
                        )}
                        {/* @end-chisel-registration */}
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'auth.login_title',
    description: 'auth.login_description',
};
