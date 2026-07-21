import { Form, Head } from '@inertiajs/react';
import {
    BellRing,
    CircleCheck,
    CircleX,
    Clock3,
    Pause,
    Play,
    Power,
    Send,
} from 'lucide-react';
import { useState } from 'react';
import { FormField, NativeSelect, PageSection } from '@/components/admin-form';
import { PageHeader } from '@/components/page-header';
import { SummaryCard } from '@/components/summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n';

type ChannelType = 'webhook' | 'telegram' | 'smtp';
type NotificationEvent =
    'change' | 'failure' | 'recovery' | 'overdue' | 'backup' | 'update';
type NotificationChannel = {
    id: number;
    type: ChannelType;
    name: string;
    enabled: boolean;
    events: NotificationEvent[];
    last_tested_at: string | null;
    last_test_succeeded: boolean | null;
};

const notificationEvents: NotificationEvent[] = [
    'change',
    'failure',
    'recovery',
    'overdue',
    'backup',
    'update',
];

export default function NotificationsIndex({
    channels,
    summary,
}: {
    channels: NotificationChannel[];
    summary: {
        active: number;
        paused: number;
        failed: number;
    };
}) {
    const { t, formatDateTime } = useI18n();
    const [channelType, setChannelType] = useState<ChannelType>('webhook');
    const [smtpPort, setSmtpPort] = useState('587');
    const channelTypeLabels: Record<ChannelType, string> = {
        webhook: t('notifications.channel_type.webhook'),
        telegram: t('notifications.channel_type.telegram'),
        smtp: t('notifications.channel_type.smtp'),
    };

    return (
        <>
            <Head title={t('notifications.title')} />
            <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
                <PageHeader
                    eyebrow={t('notifications.eyebrow')}
                    title={t('notifications.heading')}
                    description={t('notifications.description')}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    <SummaryCard
                        icon={CircleCheck}
                        label={t('notifications.summary.active')}
                        value={summary.active}
                        tone="success"
                    />
                    <SummaryCard
                        icon={Pause}
                        label={t('notifications.summary.paused')}
                        value={summary.paused}
                        tone="neutral"
                    />
                    <SummaryCard
                        icon={CircleX}
                        label={t('notifications.summary.failed')}
                        value={summary.failed}
                        tone="danger"
                    />
                </div>

                <PageSection
                    icon={BellRing}
                    title={t('notifications.channels')}
                    description={t('notifications.channels_description')}
                >
                    <div className="grid gap-4 lg:grid-cols-3">
                        {channels.map((channel) => (
                            <Card key={channel.id} className="gap-4 py-5">
                                <CardHeader className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <CardTitle className="text-base">
                                                {channel.name}
                                            </CardTitle>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {t(
                                                    'notifications.events_count',
                                                    {
                                                        total: channel.events
                                                            .length,
                                                    },
                                                )}
                                            </p>
                                        </div>
                                        <Badge
                                            className={
                                                channel.enabled
                                                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                    : 'border-border bg-muted text-muted-foreground'
                                            }
                                            variant="outline"
                                        >
                                            {channel.enabled
                                                ? t('common.active')
                                                : t('notifications.paused')}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary">
                                            {channelTypeLabels[channel.type]}
                                        </Badge>
                                        {channel.events.map((event) => (
                                            <Badge
                                                key={event}
                                                variant="outline"
                                                className="font-normal text-muted-foreground"
                                            >
                                                {t(
                                                    `notifications.event.${event}`,
                                                )}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-start gap-3 rounded-lg border bg-muted/35 p-3">
                                        {channel.last_test_succeeded ===
                                        null ? (
                                            <Clock3 className="mt-0.5 size-4 text-muted-foreground" />
                                        ) : channel.last_test_succeeded ? (
                                            <CircleCheck className="mt-0.5 size-4 text-emerald-600" />
                                        ) : (
                                            <CircleX className="mt-0.5 size-4 text-destructive" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">
                                                {channel.last_test_succeeded ===
                                                null
                                                    ? t(
                                                          'notifications.not_tested',
                                                      )
                                                    : channel.last_test_succeeded
                                                      ? t(
                                                            'notifications.test_succeeded',
                                                        )
                                                      : t(
                                                            'notifications.test_failed_status',
                                                        )}
                                            </p>
                                            {channel.last_tested_at && (
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {t(
                                                        'notifications.last_tested_at',
                                                        {
                                                            date: formatDateTime(
                                                                channel.last_tested_at,
                                                            ),
                                                        },
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Form
                                            action={`/notifications/channels/${channel.id}/test`}
                                            method="post"
                                            options={{
                                                preserveScroll: true,
                                            }}
                                        >
                                            {({ processing }) => (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={processing}
                                                >
                                                    {processing ? (
                                                        <Spinner />
                                                    ) : (
                                                        <Play />
                                                    )}
                                                    {t('notifications.test')}
                                                </Button>
                                            )}
                                        </Form>
                                        <Form
                                            action={`/notifications/channels/${channel.id}`}
                                            method="patch"
                                            options={{
                                                preserveScroll: true,
                                            }}
                                        >
                                            {({ processing }) => (
                                                <>
                                                    <input
                                                        type="hidden"
                                                        name="enabled"
                                                        value={
                                                            channel.enabled
                                                                ? '0'
                                                                : '1'
                                                        }
                                                    />
                                                    <Button
                                                        variant={
                                                            channel.enabled
                                                                ? 'outline'
                                                                : 'default'
                                                        }
                                                        size="sm"
                                                        disabled={processing}
                                                    >
                                                        {processing ? (
                                                            <Spinner />
                                                        ) : channel.enabled ? (
                                                            <Pause />
                                                        ) : (
                                                            <Power />
                                                        )}
                                                        {channel.enabled
                                                            ? t(
                                                                  'notifications.pause',
                                                              )
                                                            : t(
                                                                  'notifications.activate',
                                                              )}
                                                    </Button>
                                                </>
                                            )}
                                        </Form>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        <Card className="gap-4 border-dashed py-5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Send className="size-4 text-emerald-600" />
                                    {t('notifications.new_channel')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Form
                                    action="/notifications/channels"
                                    method="post"
                                    resetOnSuccess
                                    options={{ preserveScroll: true }}
                                    onSuccess={() => {
                                        setChannelType('webhook');
                                        setSmtpPort('587');
                                    }}
                                    className="space-y-4"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <NativeSelect
                                                label={t('notifications.type')}
                                                name="type"
                                                value={channelType}
                                                onChange={(event) =>
                                                    setChannelType(
                                                        event.target
                                                            .value as ChannelType,
                                                    )
                                                }
                                                options={[
                                                    [
                                                        'webhook',
                                                        channelTypeLabels.webhook,
                                                    ],
                                                    [
                                                        'telegram',
                                                        channelTypeLabels.telegram,
                                                    ],
                                                    [
                                                        'smtp',
                                                        channelTypeLabels.smtp,
                                                    ],
                                                ]}
                                                error={errors.type}
                                            />
                                            <FormField
                                                label={t('common.name')}
                                                name="name"
                                                maxLength={120}
                                                required
                                                error={errors.name}
                                            />

                                            {channelType === 'webhook' && (
                                                <div className="space-y-4 rounded-xl border bg-muted/25 p-4">
                                                    <p className="text-sm font-medium">
                                                        {t(
                                                            'notifications.webhook_configuration',
                                                        )}
                                                    </p>
                                                    <FormField
                                                        label={t(
                                                            'notifications.webhook_url',
                                                        )}
                                                        name="config[url]"
                                                        type="url"
                                                        placeholder="https://hooks.example.com/netkeep"
                                                        maxLength={1000}
                                                        required
                                                        error={
                                                            errors['config.url']
                                                        }
                                                    />
                                                    <FormField
                                                        label={t(
                                                            'notifications.webhook_secret',
                                                        )}
                                                        name="config[secret]"
                                                        type="password"
                                                        maxLength={10000}
                                                        autoComplete="new-password"
                                                        error={
                                                            errors[
                                                                'config.secret'
                                                            ]
                                                        }
                                                    />
                                                </div>
                                            )}

                                            {channelType === 'telegram' && (
                                                <div className="space-y-4 rounded-xl border bg-muted/25 p-4">
                                                    <p className="text-sm font-medium">
                                                        {t(
                                                            'notifications.telegram_configuration',
                                                        )}
                                                    </p>
                                                    <FormField
                                                        label={t(
                                                            'notifications.bot_token',
                                                        )}
                                                        name="config[bot_token]"
                                                        type="password"
                                                        maxLength={10000}
                                                        autoComplete="new-password"
                                                        required
                                                        error={
                                                            errors[
                                                                'config.bot_token'
                                                            ]
                                                        }
                                                    />
                                                    <FormField
                                                        label={t(
                                                            'notifications.chat_id',
                                                        )}
                                                        name="config[chat_id]"
                                                        maxLength={100}
                                                        required
                                                        error={
                                                            errors[
                                                                'config.chat_id'
                                                            ]
                                                        }
                                                    />
                                                </div>
                                            )}

                                            {channelType === 'smtp' && (
                                                <div className="space-y-4 rounded-xl border bg-muted/25 p-4">
                                                    <p className="text-sm font-medium">
                                                        {t(
                                                            'notifications.smtp_configuration',
                                                        )}
                                                    </p>
                                                    <FormField
                                                        label={t(
                                                            'notifications.smtp_server',
                                                        )}
                                                        name="config[host]"
                                                        placeholder="smtp.example.com"
                                                        maxLength={255}
                                                        required
                                                        error={
                                                            errors[
                                                                'config.host'
                                                            ]
                                                        }
                                                    />
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <FormField
                                                            label={t(
                                                                'notifications.smtp_port',
                                                            )}
                                                            name="config[port]"
                                                            type="number"
                                                            value={smtpPort}
                                                            onChange={(event) =>
                                                                setSmtpPort(
                                                                    event
                                                                        .currentTarget
                                                                        .value,
                                                                )
                                                            }
                                                            min={1}
                                                            max={65535}
                                                            required
                                                            error={
                                                                errors[
                                                                    'config.port'
                                                                ]
                                                            }
                                                        />
                                                        <NativeSelect
                                                            label={t(
                                                                'notifications.encryption',
                                                            )}
                                                            name="config[encryption]"
                                                            defaultValue="tls"
                                                            options={[
                                                                [
                                                                    'tls',
                                                                    'STARTTLS',
                                                                ],
                                                                [
                                                                    'ssl',
                                                                    t(
                                                                        'notifications.direct_tls',
                                                                    ),
                                                                ],
                                                                [
                                                                    '',
                                                                    t(
                                                                        'common.none',
                                                                    ),
                                                                ],
                                                            ]}
                                                            error={
                                                                errors[
                                                                    'config.encryption'
                                                                ]
                                                            }
                                                        />
                                                    </div>
                                                    {![
                                                        '25',
                                                        '465',
                                                        '587',
                                                    ].includes(smtpPort) &&
                                                        smtpPort !== '' && (
                                                            <div className="space-y-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3">
                                                                <p className="text-xs text-red-800 dark:text-red-200">
                                                                    {t(
                                                                        'notifications.custom_smtp_port_warning',
                                                                    )}
                                                                </p>
                                                                <FormField
                                                                    label={t(
                                                                        'notifications.custom_smtp_port_confirmation',
                                                                    )}
                                                                    name="config[port_confirmation]"
                                                                    placeholder={`I ACCEPT SMTP PORT ${smtpPort}`}
                                                                    maxLength={
                                                                        80
                                                                    }
                                                                    required
                                                                    error={
                                                                        errors[
                                                                            'config.port_confirmation'
                                                                        ]
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                    <FormField
                                                        label={t(
                                                            'notifications.smtp_user',
                                                        )}
                                                        name="config[username]"
                                                        maxLength={255}
                                                        autoComplete="username"
                                                        error={
                                                            errors[
                                                                'config.username'
                                                            ]
                                                        }
                                                    />
                                                    <FormField
                                                        label={t(
                                                            'notifications.smtp_password',
                                                        )}
                                                        name="config[password]"
                                                        type="password"
                                                        maxLength={10000}
                                                        autoComplete="new-password"
                                                        error={
                                                            errors[
                                                                'config.password'
                                                            ]
                                                        }
                                                    />
                                                    <FormField
                                                        label={t(
                                                            'notifications.sender',
                                                        )}
                                                        name="config[from]"
                                                        type="email"
                                                        maxLength={255}
                                                        required
                                                        error={
                                                            errors[
                                                                'config.from'
                                                            ]
                                                        }
                                                    />
                                                    <FormField
                                                        label={t(
                                                            'notifications.recipient',
                                                        )}
                                                        name="config[to]"
                                                        type="email"
                                                        maxLength={255}
                                                        required
                                                        error={
                                                            errors['config.to']
                                                        }
                                                    />
                                                </div>
                                            )}

                                            <fieldset className="space-y-3 rounded-xl border p-4">
                                                <legend className="px-1 text-sm font-medium">
                                                    {t('notifications.events')}
                                                </legend>
                                                <p className="text-xs text-muted-foreground">
                                                    {t(
                                                        'notifications.events_hint',
                                                    )}
                                                </p>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {notificationEvents.map(
                                                        (event) => (
                                                            <label
                                                                key={event}
                                                                className="flex cursor-pointer items-center gap-2 text-sm"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    name="events[]"
                                                                    value={
                                                                        event
                                                                    }
                                                                    defaultChecked
                                                                    className="size-4 rounded border-input accent-emerald-600"
                                                                />
                                                                {t(
                                                                    `notifications.event.${event}`,
                                                                )}
                                                            </label>
                                                        ),
                                                    )}
                                                </div>
                                                {errors.events && (
                                                    <p className="text-xs text-destructive">
                                                        {errors.events}
                                                    </p>
                                                )}
                                            </fieldset>

                                            <input
                                                type="hidden"
                                                name="enabled"
                                                value="1"
                                            />
                                            <Button
                                                className="w-full"
                                                disabled={processing}
                                            >
                                                {processing && <Spinner />}
                                                {t(
                                                    'notifications.create_channel',
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </PageSection>
            </div>
        </>
    );
}
