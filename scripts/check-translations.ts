import { catalog } from '../resources/js/i18n/catalog';
import { localeCodes } from '../resources/js/i18n/catalogs/define-messages';

const interpolationTokens = (value: string): string[] =>
    [...value.matchAll(/\{\{\s*([^},\s]+).*?\}\}/g)]
        .map((match) => match[1])
        .sort();

for (const [key, messages] of Object.entries(catalog)) {
    const expectedTokens = interpolationTokens(messages.en);

    for (const locale of localeCodes) {
        const value = messages[locale];

        if (value.trim() === '') {
            throw new Error(`Empty translation: ${key} (${locale})`);
        }

        const tokens = interpolationTokens(value);

        if (tokens.join('|') !== expectedTokens.join('|')) {
            throw new Error(`Interpolation mismatch: ${key} (${locale})`);
        }
    }
}

process.stdout.write(
    `${Object.keys(catalog).length} translation keys validated in ${localeCodes.length} locales.\n`,
);
