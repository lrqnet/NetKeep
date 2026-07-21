export const localeCodes = ['en', 'pt_BR', 'es'] as const;

export type LocaleCode = (typeof localeCodes)[number];
export type LocalizedMessage = Record<LocaleCode, string>;

export function defineMessages<
    const Messages extends Record<string, LocalizedMessage>,
>(messages: Messages): Messages {
    return messages;
}
