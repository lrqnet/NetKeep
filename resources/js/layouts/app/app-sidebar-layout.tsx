import { usePage } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { FlashMessages } from '@/components/flash-messages';
import { useI18n } from '@/i18n';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { unsafeHttpIpLogin } = usePage().props;
    const { t } = useI18n();

    return (
        <AppShell variant="sidebar">
            <FlashMessages />
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {unsafeHttpIpLogin && (
                    <div className="m-4 flex items-start gap-3 rounded-lg border border-red-500 bg-red-600 p-4 text-sm text-white md:mx-6">
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
            </AppContent>
        </AppShell>
    );
}
