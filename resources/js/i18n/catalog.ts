import { authMessages } from './catalogs/auth';
import { administrationMessages } from './catalogs/administration';
import { commonMessages } from './catalogs/common';
import { dataProtectionMessages } from './catalogs/data-protection';
import { dashboardMessages } from './catalogs/dashboard';
import { localeCodes } from './catalogs/define-messages';
import type { LocaleCode } from './catalogs/define-messages';
import { inventoryMessages } from './catalogs/inventory';
import { integrationMessages } from './catalogs/integrations';
import { modelMessages } from './catalogs/models';
import { notificationMessages } from './catalogs/notifications';
import { onboardingMessages } from './catalogs/onboarding';
import { navigationMessages } from './catalogs/navigation';
import { settingsMessages } from './catalogs/settings';

export const catalog = {
    ...commonMessages,
    ...administrationMessages,
    ...navigationMessages,
    ...onboardingMessages,
    ...authMessages,
    ...dashboardMessages,
    ...settingsMessages,
    ...inventoryMessages,
    ...integrationMessages,
    ...notificationMessages,
    ...dataProtectionMessages,
    ...modelMessages,
} as const;

export type TranslationKey = keyof typeof catalog;

export const resources = Object.fromEntries(
    localeCodes.map((locale) => [
        locale,
        {
            translation: Object.fromEntries(
                Object.entries(catalog).map(([key, value]) => [
                    key,
                    value[locale],
                ]),
            ),
        },
    ]),
) as Record<LocaleCode, { translation: Record<TranslationKey, string> }>;
