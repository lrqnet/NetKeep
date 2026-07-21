import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    GitCompareArrows,
    Github,
    Heart,
    History,
    Network,
    ShieldCheck,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

export default function Welcome({ installed }: { installed: boolean }) {
    const { t, formatNumber } = useI18n();
    const currentYear = new Date().getFullYear();

    return (
        <>
            <Head title={t('welcome.head_title')} />
            <div className="min-h-screen bg-[#07111f] text-white">
                <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6 lg:px-8">
                    <div className="flex items-center gap-3 text-lg font-semibold">
                        <span className="grid size-10 place-items-center rounded-xl bg-emerald-400 text-[#07111f]">
                            <AppLogoIcon className="size-8" />
                        </span>
                        NetKeep
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageSelector inverted />
                        <Button
                            asChild
                            className="bg-white text-[#07111f] hover:bg-slate-100"
                        >
                            <Link href={installed ? '/login' : '/register'}>
                                <span className="hidden sm:inline">
                                    {installed
                                        ? t('welcome.sign_in')
                                        : t('welcome.start_installation')}
                                </span>
                                <ArrowRight />
                            </Link>
                        </Button>
                    </div>
                </header>

                <main>
                    <section className="mx-auto grid max-w-7xl gap-16 px-6 pt-16 pb-24 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:pt-24">
                        <div>
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                                <ShieldCheck className="size-4" />
                                {t('welcome.license')}
                            </div>
                            <h1 className="max-w-4xl text-5xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
                                {t('welcome.hero')}
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
                                {t('welcome.description')}
                            </p>
                            <div className="mt-9 flex flex-wrap gap-3">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-emerald-400 text-[#07111f] hover:bg-emerald-300"
                                >
                                    <Link
                                        href={
                                            installed ? '/login' : '/register'
                                        }
                                    >
                                        {installed
                                            ? t('welcome.open_panel')
                                            : t('welcome.create_owner')}
                                        <ArrowRight />
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                                >
                                    <a
                                        href="https://github.com/lrqnet/NetKeep"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <Github />
                                        {t('welcome.source')}
                                    </a>
                                </Button>
                            </div>
                            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-400">
                                {[
                                    'Docker Compose',
                                    'PostgreSQL',
                                    'Oxidized 0.37.0',
                                    'PT · EN · ES',
                                ].map((item) => (
                                    <span
                                        key={item}
                                        className="flex items-center gap-2"
                                    >
                                        <Check className="size-4 text-emerald-400" />
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-6 rounded-[2.5rem] bg-emerald-400/10 blur-3xl" />
                            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d1b2c] shadow-2xl shadow-black/40">
                                <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
                                    <span className="size-2.5 rounded-full bg-red-400" />
                                    <span className="size-2.5 rounded-full bg-amber-300" />
                                    <span className="size-2.5 rounded-full bg-emerald-400" />
                                    <span className="ml-3 text-xs text-slate-500">
                                        netkeep.local/dashboard
                                    </span>
                                </div>
                                <div className="space-y-5 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-emerald-400 uppercase">
                                                {t('welcome.operation')}
                                            </p>
                                            <p className="mt-1 text-xl font-medium">
                                                {t('welcome.network_protected')}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">
                                            {t('welcome.engine_online')}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            [
                                                formatNumber(5024),
                                                t('welcome.devices'),
                                            ],
                                            [
                                                formatNumber(4981),
                                                t('welcome.healthy'),
                                            ],
                                            [
                                                formatNumber(12),
                                                t('welcome.changes_today'),
                                            ],
                                        ].map(([value, label]) => (
                                            <div
                                                key={label}
                                                className="rounded-2xl border border-white/8 bg-white/[.035] p-4"
                                            >
                                                <p className="text-2xl font-semibold">
                                                    {value}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {label}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[.025] p-4">
                                        {[
                                            [
                                                'POP-Centro · Router-01',
                                                t(
                                                    'welcome.configuration_changed',
                                                ),
                                                t('welcome.minutes_short', {
                                                    count: 2,
                                                }),
                                            ],
                                            [
                                                'Datacenter · Core-B',
                                                t(
                                                    'welcome.collection_completed',
                                                ),
                                                t('welcome.minutes_short', {
                                                    count: 7,
                                                }),
                                            ],
                                            [
                                                'POP-Norte · Switch-14',
                                                t('welcome.recovered'),
                                                t('welcome.minutes_short', {
                                                    count: 18,
                                                }),
                                            ],
                                        ].map(([name, event, time], index) => (
                                            <div
                                                key={name}
                                                className="flex items-center gap-3"
                                            >
                                                <span
                                                    className={`size-2 rounded-full ${index === 0 ? 'bg-amber-300' : 'bg-emerald-400'}`}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm">
                                                        {name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {event}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    {time}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="border-t border-white/10 bg-white/[.025]">
                        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:grid-cols-3 lg:px-8">
                            {[
                                {
                                    icon: Network,
                                    title: t('welcome.unified_inventory'),
                                    text: t('welcome.unified_inventory_text'),
                                },
                                {
                                    icon: History,
                                    title: t('welcome.permanent_history'),
                                    text: t('welcome.permanent_history_text'),
                                },
                                {
                                    icon: GitCompareArrows,
                                    title: t('welcome.read_only'),
                                    text: t('welcome.read_only_text'),
                                },
                            ].map(({ icon: Icon, title, text }) => (
                                <article key={title}>
                                    <Icon className="size-6 text-emerald-400" />
                                    <h2 className="mt-4 text-lg font-medium">
                                        {title}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        {text}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>
                </main>

                <footer className="border-t border-white/10 bg-[#050c15]">
                    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                        <div>
                            <div className="flex items-center gap-2.5 font-semibold">
                                <span className="grid size-8 place-items-center rounded-lg bg-emerald-400 text-[#07111f]">
                                    <AppLogoIcon className="size-6" />
                                </span>
                                NetKeep
                            </div>
                            <p className="mt-3 text-sm text-slate-500">
                                © {currentYear} NetKeep.{' '}
                                {t('welcome.footer_rights')}
                            </p>
                        </div>

                        <div className="flex flex-col items-start gap-4 text-sm sm:flex-row sm:items-center sm:gap-6">
                            <a
                                href="https://github.com/lrqnet/NetKeep/blob/main/LICENSE"
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 transition-colors hover:text-white"
                            >
                                {t('welcome.footer_license')}
                            </a>
                            <a
                                href="https://github.com/lrqnet"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
                            >
                                <Github className="size-4" />
                                {t('welcome.footer_creator')}
                            </a>
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="border-pink-300/25 bg-pink-300/10 text-pink-200 hover:bg-pink-300/15 hover:text-pink-100"
                            >
                                <a
                                    href="https://github.com/sponsors/lrqnet"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Heart />
                                    {t('welcome.footer_support')}
                                </a>
                            </Button>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
