import { Link, usePage } from '@inertiajs/react';
import {
    BellRing,
    BookOpen,
    Boxes,
    Cable,
    CloudCog,
    FileClock,
    Gauge,
    Github,
    Library,
    Network,
    KeyRound,
    Settings2,
    ShieldCheck,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useI18n } from '@/lib/i18n';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth, netkeep } = usePage().props;
    const { t } = useI18n();
    const managesSystem = ['owner', 'administrator'].includes(auth.user.role);
    const isOwner = auth.user.role === 'owner';

    const mainNavItems: NavItem[] = [
        { title: t('nav.overview'), href: '/dashboard', icon: Gauge },
        { title: t('nav.devices'), href: '/devices', icon: Cable },
        ...(managesSystem
            ? [
                  {
                      title: t('nav.credentials'),
                      href: '/credentials',
                      icon: KeyRound,
                  },
                  {
                      title: t('nav.catalog'),
                      href: '/catalog',
                      icon: Library,
                  },
                  { title: t('nav.models'), href: '/models', icon: Boxes },
                  {
                      title: t('nav.integrations'),
                      href: '/integrations',
                      icon: Network,
                  },
                  {
                      title: t('nav.notifications'),
                      href: '/notifications',
                      icon: BellRing,
                  },
                  {
                      title: t('nav.data_protection'),
                      href: '/data-protection',
                      icon: CloudCog,
                  },
                  { title: t('nav.users'), href: '/users', icon: Users },
                  { title: t('nav.audit'), href: '/audit', icon: FileClock },
                  { title: t('nav.system'), href: '/system', icon: Settings2 },
                  ...(isOwner
                      ? [
                            {
                                title: t('nav.updates'),
                                href: '/updates',
                                icon: ShieldCheck,
                                badge: netkeep.update?.available ?? false,
                            },
                        ]
                      : []),
              ]
            : []),
        {
            title: t('nav.settings'),
            href: '/settings/profile',
            icon: Settings2,
        },
    ];
    const footerNavItems: NavItem[] = [
        {
            title: `NetKeep ${netkeep.version}`,
            href: netkeep.source_version_url,
            icon: Github,
        },
        {
            title: t('nav.documentation'),
            href: `${netkeep.source_version_url}/docs`,
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={mainNavItems} />
                {isOwner && netkeep.update?.available && (
                    <Link
                        href="/updates"
                        className="mx-2 mt-auto rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm transition-colors group-data-[collapsible=icon]:hidden hover:bg-emerald-500/15"
                    >
                        <span className="block font-medium text-sidebar-primary">
                            {t('updates.sidebar_available', {
                                version: netkeep.update.version ?? '',
                            })}
                        </span>
                        <span className="mt-1 block text-xs text-sidebar-foreground">
                            {t('updates.sidebar_open')}
                        </span>
                    </Link>
                )}
            </SidebarContent>
            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
