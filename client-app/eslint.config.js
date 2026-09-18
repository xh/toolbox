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
    {
        files: ['src/**/*.ts', 'src/**/*.tsx'],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'ExportAllDeclaration',
                    message:
                        'Barrel re-exports are not used in app source - import from the defining module.'
                },
                {
                    selector: 'ExportNamedDeclaration[source][exportKind!="type"]',
                    message:
                        'Value re-exports are not used in app source - import from the defining module.'
                }
            ]
        }
    },
    // Separate block, deliberately. `no-restricted-syntax` does NOT merge across flat-config
    // entries - a later entry replaces an earlier one for overlapping files. This block exists
    // because `import ...; export {a, b}` with no `source` is a barrel the selectors above
    // cannot see, and banning the filename outright is the reliable catch.
    {
        files: ['src/**/index.ts', 'src/**/index.tsx'],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'Program',
                    message:
                        'No index.ts barrel files in app source - import from the defining module.'
                }
            ]
        }
    },
    globalIgnores(['build/**/*', 'node_modules/**/*', 'scripts/**/*'])
]);
