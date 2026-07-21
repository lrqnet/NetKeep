import { router, usePage } from '@inertiajs/react';
import { Check, Globe2, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { isLocaleCode, useI18n } from '@/i18n';
import type { LocaleCode } from '@/i18n';
import { cn } from '@/lib/utils';

type LocaleOption = {
    value: LocaleCode;
    label: string;
    html: string;
    intl: string;
};

function useLocaleSelection() {
    const { locale, availableLocales } = usePage().props;
    const { t, changeLanguage } = useI18n();
    const [updating, setUpdating] = useState(false);
    const options = Array.isArray(availableLocales)
        ? (availableLocales as LocaleOption[])
        : [];
    const currentLocale = isLocaleCode(locale) ? locale : 'en';
    const current =
        options.find((option) => option.value === currentLocale) ??
        options.find((option) => option.value === 'en');

    const updateLocale = (nextLocale: LocaleCode): void => {
        if (nextLocale === currentLocale || updating) {
            return;
        }

        setUpdating(true);
        void changeLanguage(nextLocale);
        router.put(
            '/locale',
            { locale: nextLocale },
            {
                preserveScroll: true,
                onError: () => {
                    void changeLanguage(currentLocale);
                },
                onFinish: () => setUpdating(false),
            },
        );
    };

    return {
        t,
        updating,
        options,
        currentLocale,
        current,
        updateLocale,
    };
}

export function LanguageSelector({
    className,
    inverted = false,
}: {
    className?: string;
    inverted?: boolean;
}) {
    const { t, updating, options, currentLocale, current, updateLocale } =
        useLocaleSelection();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={t('language.selector_label')}
                    aria-busy={updating}
                    className={cn(
                        inverted &&
                            'border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white',
                        className,
                    )}
                >
                    {updating ? (
                        <LoaderCircle className="animate-spin" />
                    ) : (
                        <Globe2 />
                    )}
                    <span>{current?.label ?? 'English'}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onSelect={() => updateLocale(option.value)}
                        disabled={updating}
                    >
                        <span className="flex-1">{option.label}</span>
                        {option.value === currentLocale && (
                            <Check className="size-4" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function LanguageMenu() {
    const { updating, options, currentLocale, current, updateLocale } =
        useLocaleSelection();

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={updating}>
                {updating ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                ) : (
                    <Globe2 className="mr-2 size-4" />
                )}
                <span>{current?.label ?? 'English'}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-48">
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onSelect={() => updateLocale(option.value)}
                        disabled={updating}
                    >
                        <span className="flex-1">{option.label}</span>
                        {option.value === currentLocale && (
                            <Check className="size-4" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    );
}
