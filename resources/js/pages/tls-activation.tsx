import { Head } from '@inertiajs/react';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

export default function TlsActivation({
    canonicalUrl,
}: {
    canonicalUrl: string;
}) {
    const { t } = useI18n();
    const [ready, setReady] = useState(false);
    const destination = `${canonicalUrl}/dashboard`;

    useEffect(() => {
        let active = true;
        let timer: ReturnType<typeof setTimeout>;

        const check = async () => {
            try {
                const response = await fetch('/tls-activation/status', {
                    credentials: 'same-origin',
                    headers: { Accept: 'application/json' },
                });
                const data = (await response.json()) as { ready?: boolean };

                if (active && data.ready) {
                    setReady(true);
                    window.location.replace(destination);

                    return;
                }
            } catch {
                setReady(false);
            }

            if (active) {
                timer = setTimeout(check, 1000);
            }
        };

        void check();

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [destination]);

    return (
        <>
            <Head title={t('setup.tls_activation_title')} />
            <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 dark:bg-[#07111f]">
                <div className="w-full max-w-lg rounded-2xl border bg-background p-8 text-center shadow-xl shadow-slate-950/5">
                    <div className="mb-8 flex items-center justify-between gap-4">
                        <span className="flex items-center gap-3 font-semibold">
                            <span className="grid size-11 place-items-center rounded-xl bg-emerald-500 text-slate-950">
                                <AppLogoIcon className="size-8" />
                            </span>
                            NetKeep
                        </span>
                        <LanguageSelector />
                    </div>
                    <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                        {ready ? (
                            <ShieldCheck className="size-7" />
                        ) : (
                            <LoaderCircle className="size-7 animate-spin" />
                        )}
                    </span>
                    <h1 className="mt-5 text-2xl font-semibold">
                        {t('setup.tls_activation_title')}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {t('setup.tls_activation_description')}
                    </p>
                    <Button asChild className="mt-6 w-full">
                        <a href={destination}>
                            {t('setup.tls_activation_retry')}
                        </a>
                    </Button>
                </div>
            </main>
        </>
    );
}
