import assert from 'node:assert/strict';
import { ESLint } from 'eslint';

const eslint = new ESLint();
const cases = [
    [
        'import-x/order',
        "import local from './local';\nimport React from 'react';\nconsole.log(local, React);",
    ],
    [
        'import-x/consistent-type-specifier-style',
        "import { type ReactNode } from 'react';\nexport type Content = ReactNode;",
    ],
    [
        '@eslint-react/no-missing-key',
        'export const List = () => [1, 2].map((value) => <span>{value}</span>);',
    ],
    [
        '@eslint-react/dom-no-unknown-property',
        'export const Label = () => <label class="label" />;',
    ],
    [
        '@eslint-react/dom-no-unsafe-target-blank',
        'export const Link = () => <a href="https://example.com" target="_blank">Link</a>;',
    ],
];

for (const [ruleId, code] of cases) {
    const [result] = await eslint.lintText(code, {
        filePath: 'resources/js/lint-regression-fixture.tsx',
    });
    assert(
        result.messages.some((message) => message.ruleId === ruleId),
        ruleId,
    );
}

const [valid] = await eslint.lintText(
    'export const List = () => [1, 2].map((value) => <span key={value}>{value}</span>);',
    { filePath: 'resources/js/lint-regression-fixture.tsx' },
);
assert.equal(valid.errorCount, 0);
assert.equal(valid.warningCount, 0);
console.log('Lint configuration regression checks passed.');
