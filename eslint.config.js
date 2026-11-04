import { createRequire } from 'node:module';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import prettier from 'eslint-config-prettier/flat';
import react from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import typescript from 'typescript-eslint';

const require = createRequire(import.meta.url);
// The CommonJS entry avoids eager ESM imports of removed minimatch APIs
// in unused import-x rules. The enabled rules use the current matching API.
const importPlugin = require('eslint-plugin-import-x');

const controlStatements = [
    'if',
    'return',
    'for',
    'while',
    'do',
    'switch',
    'try',
    'throw',
];
const paddingAroundControl = [
    ...controlStatements.flatMap((stmt) => [
        { blankLine: 'always', prev: '*', next: stmt },
        { blankLine: 'always', prev: stmt, next: '*' },
    ]),
];

/** @type {import('eslint').Linter.Config[]} */
export default [
    js.configs.recommended,
    reactHooks.configs.flat['recommended-latest'],
    ...typescript.configs.recommended,
    {
        plugins: {
            '@eslint-react': react,
        },
        rules: {
            '@eslint-react/no-missing-key': 'error',
            '@eslint-react/no-missing-component-display-name': 'error',
            '@eslint-react/no-direct-mutation-state': 'error',
            '@eslint-react/jsx-no-children-prop': 'error',
            '@eslint-react/jsx-no-comment-textnodes': 'error',
            '@eslint-react/dom-no-dangerously-set-innerhtml-with-children':
                'error',
            '@eslint-react/dom-no-unknown-property': 'error',
            '@eslint-react/dom-no-unsafe-target-blank': 'error',
            '@eslint-react/dom-no-void-elements-with-children': 'error',
        },
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },
    {
        plugins: {
            'import-x': importPlugin,
        },
        settings: {
            'import-x/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json',
                },
                node: true,
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports',
                },
            ],
            'import-x/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                    ],
                    // alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],
            'import-x/consistent-type-specifier-style': [
                'error',
                'prefer-top-level',
            ],
        },
    },
    {
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            '@stylistic/brace-style': [
                'error',
                '1tbs',
                { allowSingleLine: false },
            ],
            '@stylistic/padding-line-between-statements': [
                'error',
                ...paddingAroundControl,
            ],
        },
    },
    {
        ignores: [
            'vendor',
            'node_modules',
            'public',
            'bootstrap/ssr',
            'tailwind.config.js',
            'vite.config.ts',
            'resources/js/actions/**',
            'resources/js/components/ui/*',
            'resources/js/routes/**',
            'resources/js/wayfinder/**',
        ],
    },
    prettier,
    {
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            curly: ['error', 'all'],
            '@stylistic/brace-style': [
                'error',
                '1tbs',
                { allowSingleLine: false },
            ],
        },
    },
];
