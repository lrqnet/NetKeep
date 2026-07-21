import { Form, Head, router, usePage } from '@inertiajs/react';
import { Crown, Plus, Shield, UserRound, Users } from 'lucide-react';
import { useId } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n';
import type { TranslationKey } from '@/i18n/catalog';

type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    locale: string;
    is_active: boolean;
    last_login_at: string | null;
};
type Role = { value: string; label: string };

export default function UsersIndex({
    users,
    roles,
}: {
    users: User[];
    roles: Role[];
}) {
    const { auth, availableLocales } = usePage().props;
    const current = auth.user;
    const { t, formatDateTime } = useI18n();
    const roleKeys: Record<string, TranslationKey> = {
        owner: 'users.role.owner',
        admin: 'users.role.admin',
        operator: 'users.role.operator',
        viewer: 'users.role.viewer',
    };

    return (
        <>
            <Head title={t('users.title')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('users.eyebrow')}
                    title={t('users.heading')}
                    description={t('users.description')}
                />

                <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
                    <Card className="gap-0 overflow-hidden py-0">
                        <CardContent className="px-0">
                            <div className="divide-y">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center"
                                    >
                                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
                                            {user.role === 'owner' ? (
                                                <Crown className="size-4 text-amber-600" />
                                            ) : (
                                                <UserRound className="size-4" />
                                            )}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate font-medium">
                                                    {user.name}
                                                </p>
                                                {!user.is_active && (
                                                    <Badge variant="secondary">
                                                        {t('users.inactive')}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="truncate text-sm text-muted-foreground">
                                                {user.email}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {user.last_login_at
                                                    ? t('users.last_access', {
                                                          date: formatDateTime(
                                                              user.last_login_at,
                                                          ),
                                                      })
                                                    : t('users.never_accessed')}
                                            </p>
                                        </div>
                                        {user.role === 'owner' && (
                                            <Badge variant="outline">
                                                {t('users.role.owner')}
                                            </Badge>
                                        )}
                                        {(current.role === 'owner' ||
                                            user.role !== 'owner') && (
                                            <Form
                                                action={`/users/${user.id}`}
                                                method="put"
                                                className="grid w-full gap-2 lg:w-auto lg:grid-cols-[140px_210px_140px_110px_auto_auto]"
                                            >
                                                {({ processing }) => (
                                                    <>
                                                        <Input
                                                            name="name"
                                                            defaultValue={
                                                                user.name
                                                            }
                                                            maxLength={255}
                                                            aria-label={t(
                                                                'common.name',
                                                            )}
                                                            className="h-8 text-xs"
                                                            required
                                                        />
                                                        <Input
                                                            name="email"
                                                            type="email"
                                                            defaultValue={
                                                                user.email
                                                            }
                                                            maxLength={255}
                                                            aria-label={t(
                                                                'common.email',
                                                            )}
                                                            className="h-8 text-xs"
                                                            required
                                                        />
                                                        {user.role ===
                                                        'owner' ? (
                                                            <input
                                                                type="hidden"
                                                                name="role"
                                                                value="owner"
                                                            />
                                                        ) : (
                                                            <select
                                                                name="role"
                                                                defaultValue={
                                                                    user.role
                                                                }
                                                                aria-label={t(
                                                                    'users.role_label',
                                                                    {
                                                                        name: user.name,
                                                                    },
                                                                )}
                                                                className="h-8 rounded-md border bg-background px-2 text-xs"
                                                            >
                                                                {roles
                                                                    .filter(
                                                                        (
                                                                            role,
                                                                        ) =>
                                                                            role.value !==
                                                                            'owner',
                                                                    )
                                                                    .map(
                                                                        (
                                                                            role,
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    role.value
                                                                                }
                                                                                value={
                                                                                    role.value
                                                                                }
                                                                            >
                                                                                {t(
                                                                                    roleKeys[
                                                                                        role
                                                                                            .value
                                                                                    ],
                                                                                )}
                                                                            </option>
                                                                        ),
                                                                    )}
                                                            </select>
                                                        )}
                                                        <select
                                                            name="locale"
                                                            defaultValue={
                                                                user.locale
                                                            }
                                                            aria-label={t(
                                                                'users.locale_label',
                                                                {
                                                                    name: user.name,
                                                                },
                                                            )}
                                                            className="h-8 rounded-md border bg-background px-2 text-xs"
                                                        >
                                                            {availableLocales.map(
                                                                (locale) => (
                                                                    <option
                                                                        key={
                                                                            locale.value
                                                                        }
                                                                        value={
                                                                            locale.value
                                                                        }
                                                                    >
                                                                        {
                                                                            locale.label
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                        {user.role ===
                                                        'owner' ? (
                                                            <input
                                                                type="hidden"
                                                                name="is_active"
                                                                value="1"
                                                            />
                                                        ) : (
                                                            <label className="flex h-8 items-center gap-2 text-xs whitespace-nowrap">
                                                                <input
                                                                    type="hidden"
                                                                    name="is_active"
                                                                    value="0"
                                                                />
                                                                <input
                                                                    type="checkbox"
                                                                    name="is_active"
                                                                    value="1"
                                                                    defaultChecked={
                                                                        user.is_active
                                                                    }
                                                                    className="size-4 rounded border"
                                                                />
                                                                {t(
                                                                    'common.active',
                                                                )}
                                                            </label>
                                                        )}
                                                        <Button
                                                            type="submit"
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            {processing && (
                                                                <Spinner />
                                                            )}
                                                            {t('common.save')}
                                                        </Button>
                                                    </>
                                                )}
                                            </Form>
                                        )}
                                        {current.role === 'owner' &&
                                            user.role !== 'owner' &&
                                            user.is_active && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                t(
                                                                    'users.transfer_confirm',
                                                                    {
                                                                        name: user.name,
                                                                    },
                                                                ),
                                                            )
                                                        ) {
                                                            router.post(
                                                                `/users/${user.id}/transfer-ownership`,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <Crown />
                                                    {t('users.make_owner')}
                                                </Button>
                                            )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="sticky top-4 gap-4 py-5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Plus className="size-4 text-emerald-600" />
                                {t('users.invite')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form
                                action="/users"
                                method="post"
                                resetOnSuccess
                                className="space-y-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <Field
                                            label={t('common.name')}
                                            name="name"
                                            error={errors.name}
                                        />
                                        <Field
                                            label={t('common.email')}
                                            name="email"
                                            type="email"
                                            error={errors.email}
                                        />
                                        <div className="space-y-1.5">
                                            <Label htmlFor="role">
                                                {t('users.role')}
                                            </Label>
                                            <select
                                                id="role"
                                                name="role"
                                                defaultValue="viewer"
                                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                            >
                                                {roles
                                                    .filter(
                                                        (role) =>
                                                            role.value !==
                                                            'owner',
                                                    )
                                                    .map((role) => (
                                                        <option
                                                            key={role.value}
                                                            value={role.value}
                                                        >
                                                            {t(
                                                                roleKeys[
                                                                    role.value
                                                                ],
                                                            )}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="locale">
                                                {t('common.language')}
                                            </Label>
                                            <select
                                                id="locale"
                                                name="locale"
                                                defaultValue="en"
                                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                            >
                                                {availableLocales.map(
                                                    (locale) => (
                                                        <option
                                                            key={locale.value}
                                                            value={locale.value}
                                                        >
                                                            {locale.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>
                                        <Button
                                            className="w-full"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <Users />
                                            )}
                                            {t('users.send_invite')}
                                        </Button>
                                        <p className="text-xs leading-5 text-muted-foreground">
                                            {t('users.invite_hint')}
                                        </p>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        ['owner', Crown],
                        ['admin', Shield],
                        ['operator', UserRound],
                        ['viewer', UserRound],
                    ].map(([role, Icon]) => {
                        const RoleIcon = Icon as typeof Crown;
                        const key = roleKeys[role as string];
                        const descriptionKey =
                            `${key}_description` as TranslationKey;

                        return (
                            <div
                                key={role as string}
                                className="rounded-xl border p-4"
                            >
                                <RoleIcon className="size-4 text-emerald-600" />
                                <p className="mt-3 text-sm font-medium">
                                    {t(key)}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {t(descriptionKey)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

function Field({
    label,
    error,
    ...props
}: React.ComponentProps<typeof Input> & {
    label: string;
    error?: string;
}) {
    const id = useId();

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input required {...props} id={id} />
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
