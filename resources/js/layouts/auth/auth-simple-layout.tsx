import { Link, usePage } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { LanguageSelector } from '@/components/language-selector';
import { useI18n } from '@/i18n';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { unsafeHttpIpLogin } = usePage().props;
    const { t } = useI18n();

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="absolute top-4 right-4 md:top-6 md:right-6">
                <LanguageSelector />
            </div>
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
                                <AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {unsafeHttpIpLogin && (
                        <div className="flex items-start gap-3 rounded-lg border border-red-500 bg-red-600 p-4 text-sm text-white">
                            <ShieldAlert className="mt-0.5 size-5 shrink-0" />
                            <div>
                                <p className="font-semibold">
                                    {t('system.unsafe_http_banner_title')}
                                </p>
                                <p className="mt-1 text-red-50">
                                    {t('system.unsafe_http_banner_description')}
                                </p>
                            </div>
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}
