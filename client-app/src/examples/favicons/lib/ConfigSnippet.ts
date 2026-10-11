import type {FaviconSpec} from './FaviconSpec';

/**
 * Build the `configureRsbuild()` options a Hoist app needs to adopt a design - the favicon, the
 * preloader colors and the manifest theme color. The brand color is the backdrop, or the glyph
 * color when there is no backdrop (in which case the preloader keeps its default spinner color).
 */
export function buildConfigSnippet(spec: FaviconSpec): string {
    const hasBackdrop = spec.shape !== 'none',
        brandColor = hasBackdrop ? spec.bgColor : spec.fgColor;

    return [
        '// Merge into configureRsbuild({...}) in client-app/rsbuild.config.mjs',
        '// (merge manifestConfig with any keys you already set, e.g. start_url)',
        `favicon: './public/favicon.svg',`,
        `preloadBackgroundColor: '${brandColor}',`,
        ...(hasBackdrop ? [`preloadSpinnerColor: '${spec.fgColor}',`] : []),
        'manifestConfig: {',
        `    theme_color: '${brandColor}'`,
        '},'
    ].join('\n');
}
