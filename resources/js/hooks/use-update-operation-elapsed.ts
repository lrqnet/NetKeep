import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { updateOperationActive } from '@/types/updates';
import type { UpdateOperation } from '@/types/updates';

export function useUpdateOperationElapsed(
    operation: UpdateOperation | null,
): string {
    const { t } = useI18n();
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!operation || !updateOperationActive(operation)) {
            return;
        }

        const interval = window.setInterval(() => setNow(Date.now()), 1000);

        return () => window.clearInterval(interval);
    }, [operation]);

    if (!operation) {
        return '';
    }

    const end = operation.completed_at
        ? Date.parse(operation.completed_at)
        : now;
    const seconds = Math.max(
        operation.elapsed_seconds,
        Math.floor((end - Date.parse(operation.requested_at)) / 1000),
    );

    if (seconds < 60) {
        return t('updates.duration_seconds', { count: seconds });
    }

    if (seconds < 3600) {
        return t('updates.duration_minutes', {
            count: Math.floor(seconds / 60),
        });
    }

    return t('updates.duration_hours_minutes', {
        hours: Math.floor(seconds / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
    });
}
