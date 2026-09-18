const {defineConfig, globalIgnores} = require('eslint/config'),
    xhEslintConfig = require('@xh/eslint-config'),
    prettier = require('eslint-config-prettier');

module.exports = defineConfig([
    {
        extends: [xhEslintConfig, prettier]
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            // Type-only imports must be explicit. Toolbox transpiles per-file via Babel
            // (@babel/plugin-transform-typescript), so an import's type-only-ness is inferred
            // rather than declared. Stating it removes the ambiguity and - more usefully -
            // guarantees the edge is erased at build time, which is what keeps type-only
            // references from forming runtime import cycles.
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports',
                    disallowTypeAnnotations: true
                }
            ],
            '@typescript-eslint/consistent-type-exports': 'error',
            '@typescript-eslint/no-import-type-side-effects': 'error'
        }
    },
    globalIgnores(['build/**/*', 'node_modules/**/*', 'scripts/**/*'])
]);
