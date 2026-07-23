import type { Auth } from '@/types/auth';
import type { UpdateOperation } from '@/types/updates';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            locale: 'pt_BR' | 'en' | 'es';
            availableLocales: Array<{
                value: 'pt_BR' | 'en' | 'es';
                label: string;
                html: string;
                intl: string;
            }>;
            auth: Auth;
            organization: {
                name: string;
                logo_path: string | null;
                locale: 'pt_BR' | 'en' | 'es';
                timezone: string;
                domain: string | null;
            } | null;
            flash: {
                success?: string;
                warning?: string;
                error?: string;
            };
            netkeep: {
                version: string;
                source_url: string;
                source_version_url: string;
                update: {
                    available: boolean;
                    version: string | null;
                    operation: UpdateOperation | null;
                } | null;
            };
            unsafeHttpIpLogin: boolean;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
