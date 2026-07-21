import type { FormEvent } from 'react';

export function limitInputLength(
    event: FormEvent<HTMLInputElement>,
    maxLength: number,
): void {
    event.currentTarget.value = event.currentTarget.value.slice(0, maxLength);
}

export function normalizeEmailInput(
    event: FormEvent<HTMLInputElement>,
    maxLength: number,
): void {
    event.currentTarget.value = event.currentTarget.value
        .replace(/\s/gu, '')
        .slice(0, maxLength);
}
