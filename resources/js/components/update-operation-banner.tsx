import { Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    LoaderCircle,
    RotateCw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useUpdateOperationElapsed } from '@/hooks/use-update-operation-elapsed';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { updateOperationActive } from '@/types/updates';
import type { UpdateOperation } from '@/types/updates';

export function UpdateOperationBanner() {
    const page = usePage();
    const sharedOperation = page.props.netkeep.update?.operation ?? null;
    const [polledOperation, setPolledOperation] =
        useState<UpdateOperation | null>(null);
    const [reconnectingUuid, setReconnectingUuid] = useState<string | null>(
        null,
    );
    const { t } = useI18n();
    const operation =
        polledOperation?.uuid === sharedOperation?.uuid
            ? polledOperation
            : sharedOperation;
    const reconnecting = reconnectingUuid === operation?.uuid;
    const operationUuid = operation?.uuid;
    const operationActive = operation
        ? updateOperationActive(operation)
        : false;

    useEffect(() => {
        if (
            !operationUuid ||
            !operationActive ||
            page.url.startsWith('/updates')
        ) {
            return;
        }

        let cancelled = false;
        const refresh = async () => {
            try {
                const response = await fetch(
                    `/updates/operations/${operationUuid}`,
                    {
                        credentials: 'same-origin',
                        headers: { Accept: 'application/json' },
                        cache: 'no-store',
                    },
                );

                if (!response.ok) {
                    throw new Error('update_operation_unavailable');
                }

                const next = (await response.json()) as UpdateOperation;

                if (!cancelled) {
                    setPolledOperation(next);
                    setReconnectingUuid(null);
                }
            } catch {
                if (!cancelled) {
                    setReconnectingUuid(operationUuid);
                }
            }
        };

        const interval = window.setInterval(() => void refresh(), 5000);
        void refresh();

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [operationActive, operationUuid, page.url]);

    const elapsed = useUpdateOperationElapsed(operation);
    const message = useMemo(() => {
        if (!operation) {
            return '';
        }

        if (reconnecting) {
            return t('updates.global_reconnecting');
        }

        if (operation.stalled) {
            return t('updates.global_stalled');
        }

        if (operation.status === 'succeeded') {
            return t('updates.global_succeeded', {
                version: operation.to_version,
            });
        }

        if (operation.status === 'failed') {
            return t('updates.global_failed');
        }

        if (operation.status === 'recovery_required') {
            return t('updates.global_recovery_required');
        }

        return t('updates.global_running', {
            from: operation.from_version,
            to: operation.to_version,
        });
    }, [operation, reconnecting, t]);

    if (!operation) {
        return null;
    }

    const failed = ['failed', 'recovery_required'].includes(operation.status);
    const succeeded = operation.status === 'succeeded';

    return (
        <div
            className={cn(
                'mx-4 mt-4 flex items-center gap-3 rounded-lg border p-3 text-sm md:mx-6',
                failed
                    ? 'border-red-500/50 bg-red-500/10 text-red-950 dark:text-red-100'
                    : succeeded
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100'
                      : operation.stalled || reconnecting
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-100'
                        : 'border-primary/30 bg-primary/5',
            )}
            role="status"
            aria-live="polite"
        >
            {failed || operation.stalled ? (
                <AlertTriangle className="size-5 shrink-0" />
            ) : succeeded ? (
                <CheckCircle2 className="size-5 shrink-0" />
            ) : reconnecting ? (
                <RotateCw className="size-5 shrink-0" />
            ) : (
                <LoaderCircle className="size-5 shrink-0 animate-spin" />
            )}
            <div className="min-w-0 flex-1">
                <p className="font-medium">{message}</p>
                <p className="mt-0.5 text-xs opacity-80">
                    {t('updates.elapsed', { duration: elapsed })}
                </p>
            </div>
            <Link
                href="/updates"
                className="shrink-0 font-medium underline underline-offset-4"
            >
                {t('updates.view_progress')}
            </Link>
        </div>
    );
}
