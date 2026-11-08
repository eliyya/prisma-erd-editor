import { defineConfig } from 'vite-plus'

const ignorePatterns = ['dist/**', 'coverage/**', 'node_modules/**']

export default defineConfig({
    fmt: {
        ignorePatterns: [
            ...ignorePatterns,
            'pnpm-lock.yaml',
            'test/fixtures/erd-editor.schema.json',
        ],
        printWidth: 80,
        tabWidth: 4,
        semi: false,
        singleQuote: true,
        trailingComma: 'all',
        arrowParens: 'avoid',
        sortPackageJson: false,
    },
    lint: {
        ignorePatterns,
        plugins: ['typescript', 'import', 'vitest', 'unicorn', 'oxc'],
        options: {
            typeAware: true,
            typeCheck: true,
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'import/first': 'error',
            'import/no-duplicates': 'error',
            'vitest/valid-expect': ['error', { maxArgs: 2 }],
        },
    },
    test: {
        environment: 'node',
        include: ['test/**/*.test.js'],
        testTimeout: 60_000,
    },
})
