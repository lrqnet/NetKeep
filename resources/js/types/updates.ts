export type UpdateOperationStatus =
    | 'queued'
    | 'backing_up'
    | 'validating'
    | 'downloading'
    | 'applying'
    | 'restarting'
    | 'succeeded'
    | 'failed'
    | 'recovery_required';

export type UpdateOperation = {
    uuid: string;
    trigger: 'manual' | 'automatic';
    status: UpdateOperationStatus;
    from_version: string;
    to_version: string;
    compatibility: 'same_major' | 'major_upgrade' | 'unsupported';
    safe_error_code: string | null;
    requested_at: string;
    started_at: string | null;
    completed_at: string | null;
    last_progress_at: string;
    acknowledged_at: string | null;
    elapsed_seconds: number;
    stalled: boolean;
    stalled_after_seconds: number;
};

export const activeUpdateStatuses: UpdateOperationStatus[] = [
    'queued',
    'backing_up',
    'validating',
    'downloading',
    'applying',
    'restarting',
];

export function updateOperationActive(operation: UpdateOperation): boolean {
    return activeUpdateStatuses.includes(operation.status);
}
