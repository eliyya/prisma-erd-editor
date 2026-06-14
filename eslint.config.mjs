import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import prettierPlugin from 'eslint-plugin-prettier'
import securityPlugin from 'eslint-plugin-security'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    {
        ignores: ['dist/**', 'node_modules/**', 'prisma/schema.erd', 'te.erd'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            import: importPlugin,
            prettier: prettierPlugin,
            security: securityPlugin,
        },
        settings: {
            'import/resolver': {
                typescript: {
                    project: './tsconfig.json',
                },
            },
        },
        rules: {
            ...securityPlugin.configs.recommended.rules,
            ...prettierConfig.rules,
            'security/detect-non-literal-fs-filename': 'off',
            'security/detect-object-injection': 'off',
            'prettier/prettier': ['error', { endOfLine: 'auto' }],
            'import/extensions': [
                'error',
                'ignorePackages',
                {
                    js: 'always',
                    ts: 'never',
                },
            ],
            'import/newline-after-import': 'error',
            'import/no-duplicates': 'error',
            'import/no-unresolved': 'error',
            'import/order': [
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
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_' },
            ],
        },
    },
)
