import i18n from 'i18next';
import type { TOptions } from 'i18next';
import { router } from '@inertiajs/react';
import { useCallback } from 'react';
import { initReactI18next, useTranslation } from 'react-i18next';
import { catalog, resources } from './catalog';
import type { TranslationKey } from './catalog';
import { localeCodes } from './catalogs/define-messages';
import type { LocaleCode } from './catalogs/define-messages';

const htmlLocales: Record<LocaleCode, string> = {
    en: 'en',
    pt_BR: 'pt-BR',
    es: 'es',
};

const intlLocales: Record<LocaleCode, string> = {
    en: 'en-US',
    pt_BR: 'pt-BR',
    es: 'es-419',
};

const localeFromDocument = (): LocaleCode => {
    if (typeof document === 'undefined') {
        return 'en';
    }

    const htmlLocale = document.documentElement.lang.toLowerCase();

    if (htmlLocale === 'pt-br' || htmlLocale === 'pt_br') {
        return 'pt_BR';
    }

    if (htmlLocale.startsWith('es')) {
        return 'es';
    }

    return 'en';
};

void i18n.use(initReactI18next).init({
    resources,
    lng: localeFromDocument(),
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
    returnNull: false,
});

export function isLocaleCode(value: unknown): value is LocaleCode {
    return localeCodes.includes(value as LocaleCode);
}

export function isTranslationKey(value: unknown): value is TranslationKey {
    return typeof value === 'string' && value in catalog;
}

export function setDocumentLocale(locale: LocaleCode): void {
    document.documentElement.lang = htmlLocales[locale];
}

export function initializeLocaleSync(): void {
    router.on('navigate', (event) => {
        const locale = event.detail.page.props.locale;

        if (!isLocaleCode(locale)) {
            return;
        }

        void i18n.changeLanguage(locale);
        setDocumentLocale(locale);
    });
}

export function useI18n() {
    const { t: translate, i18n: instance } = useTranslation();
    const locale = isLocaleCode(instance.resolvedLanguage)
        ? instance.resolvedLanguage
        : 'en';
    const t = useCallback(
        (key: TranslationKey, options?: TOptions): string =>
            String(translate(key, options)),
        [translate],
    );

    return {
        t,
        locale,
        changeLanguage: async (nextLocale: LocaleCode): Promise<void> => {
            await instance.changeLanguage(nextLocale);
            setDocumentLocale(nextLocale);
        },
        formatDateTime: (
            value: string | number | Date,
            options?: Intl.DateTimeFormatOptions,
        ): string =>
            new Intl.DateTimeFormat(intlLocales[locale], {
                dateStyle: 'medium',
                timeStyle: 'short',
                ...options,
            }).format(new Date(value)),
        formatNumber: (
            value: number,
            options?: Intl.NumberFormatOptions,
        ): string =>
            new Intl.NumberFormat(intlLocales[locale], options).format(value),
    };
}

export { catalog, i18n };
export type { LocaleCode, TranslationKey };
