import {describe, expect, it} from 'vitest';
import {buildConfigSnippet} from './ConfigSnippet';
import {DEFAULT_SPEC} from './FaviconSpec';

describe('buildConfigSnippet', () => {
    it('uses the backdrop as the brand color for a backdrop shape', () => {
        const spec = {
            ...DEFAULT_SPEC,
            shape: 'square' as const,
            fgColor: '#ffffff',
            bgColor: '#0b4f6c'
        };
        expect(buildConfigSnippet(spec)).toBe(
            [
                '// Merge into configureRsbuild({...}) in client-app/rsbuild.config.mjs',
                '// (merge manifestConfig with any keys you already set, e.g. start_url)',
                "favicon: './public/favicon.svg',",
                "preloadBackgroundColor: '#0b4f6c',",
                "preloadSpinnerColor: '#ffffff',",
                'manifestConfig: {',
                "    theme_color: '#0b4f6c'",
                '},'
            ].join('\n')
        );
    });

    it('produces the same lines for every backdrop shape', () => {
        const base = {...DEFAULT_SPEC, fgColor: '#263238', bgColor: '#f7931c'},
            snippets = (['square', 'rounded', 'circle'] as const).map(shape =>
                buildConfigSnippet({...base, shape})
            );
        expect(new Set(snippets).size).toBe(1);
        expect(snippets[0]).toContain("preloadSpinnerColor: '#263238',");
    });

    it('uses the glyph color and omits the spinner color for shape none', () => {
        const spec = {
            ...DEFAULT_SPEC,
            shape: 'none' as const,
            fgColor: '#f7931c',
            bgColor: '#ffffff'
        };
        expect(buildConfigSnippet(spec)).toBe(
            [
                '// Merge into configureRsbuild({...}) in client-app/rsbuild.config.mjs',
                '// (merge manifestConfig with any keys you already set, e.g. start_url)',
                "favicon: './public/favicon.svg',",
                "preloadBackgroundColor: '#f7931c',",
                'manifestConfig: {',
                "    theme_color: '#f7931c'",
                '},'
            ].join('\n')
        );
    });
});
