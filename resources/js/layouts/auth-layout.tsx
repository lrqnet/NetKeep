import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { isTranslationKey, useI18n } from '@/i18n';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    const { t } = useI18n();
    const localizedTitle = isTranslationKey(title) ? t(title) : title;
    const localizedDescription = isTranslationKey(description)
        ? t(description)
        : description;

    return (
        <AuthLayoutTemplate
            title={localizedTitle}
            description={localizedDescription}
        >
            {children}
        </AuthLayoutTemplate>
    );
}
