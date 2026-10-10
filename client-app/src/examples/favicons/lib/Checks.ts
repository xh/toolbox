import {contrastRatio} from './Colors';
import type {FaviconSpec} from './FaviconSpec';
import {PREFIX_LABELS} from './FaviconSpec';

/** A preview tile that can flag a failed check - see {@link FaviconCheck.preview}. */
export type FaviconPreviewId = 'hero' | 'tabs' | 'sizes';

/** Titles of the preview tiles that can flag a failed check, for naming them in messages. */
export const PREVIEW_TITLES: Record<FaviconPreviewId, string> = {
    hero: 'favicon.svg',
    tabs: 'Browser tabs',
    sizes: 'Every size'
};

/**
 * A check run against a design - listed in the Checks panel, and flagged with a warning banner on
 * the preview that shows the problem when it fails.
 */
export interface FaviconCheck {
    /** Short name of what is checked. */
    label: string;
    /** Measured or current value, shown beside the label - e.g. a contrast ratio. */
    value: string;
    /** One-line warning when the design fails this check, or null when it passes. */
    warning: string;
    /** How to fix a failure, or null when the check passes. */
    advice: string;
    /** The preview tile where a failure shows. */
    preview: FaviconPreviewId;
}

/** Active-tab colors of the browser-tab mocks - checked for glyph contrast with shape 'none'. */
export const LIGHT_TAB_BG = '#ffffff';
export const DARK_TAB_BG = '#35363a';

/** Minimum glyph contrast ratio - the WCAG threshold for graphical objects. */
export const MIN_CONTRAST = 3;

/**
 * Run the design checks for a spec. With no backdrop the glyph sits directly on the browser tab,
 * so it is checked against light and dark tabs - otherwise against its own backdrop.
 */
export function designChecks(spec: FaviconSpec): FaviconCheck[] {
    const {fgColor, bgColor, shape, prefix} = spec,
        ret: FaviconCheck[] = [];

    if (shape === 'none') {
        ret.push(
            contrastCheck({
                label: 'Contrast on light tabs',
                ratio: contrastRatio(fgColor, LIGHT_TAB_BG),
                warning: 'Low contrast on light tabs',
                advice: 'Try a darker glyph, or add a backdrop.',
                preview: 'tabs'
            }),
            contrastCheck({
                label: 'Contrast on dark tabs',
                ratio: contrastRatio(fgColor, DARK_TAB_BG),
                warning: 'Low contrast on dark tabs',
                advice: 'Try a lighter glyph, or add a backdrop.',
                preview: 'tabs'
            })
        );
    } else {
        ret.push(
            contrastCheck({
                label: 'Glyph on backdrop contrast',
                ratio: contrastRatio(fgColor, bgColor),
                warning: 'Low glyph contrast',
                advice: `Aim for at least ${MIN_CONTRAST}:1 - pull the glyph and backdrop colors further apart in lightness.`,
                preview: 'hero'
            })
        );
    }

    const isFine = prefix === 'fal' || prefix === 'fat';
    ret.push({
        label: 'Stroke weight at 16px',
        value: PREFIX_LABELS[prefix],
        warning: isFine ? `${PREFIX_LABELS[prefix]} strokes can vanish at 16px` : null,
        advice: isFine
            ? 'Check the pixel peek - a heavier weight usually holds up better at small sizes.'
            : null,
        preview: 'sizes'
    });

    return ret;
}

/** Format a contrast ratio for display - e.g. `4.5:1`. */
export function fmtRatio(ratio: number): string {
    return `${ratio.toFixed(1)}:1`;
}

//------------------
// Implementation
//------------------
function contrastCheck({
    label,
    ratio,
    warning,
    advice,
    preview
}: {
    label: string;
    ratio: number;
    warning: string;
    advice: string;
    preview: FaviconPreviewId;
}): FaviconCheck {
    const value = fmtRatio(ratio),
        fails = ratio < MIN_CONTRAST;
    return {
        label,
        value,
        warning: fails ? `${warning} (${value})` : null,
        advice: fails ? advice : null,
        preview
    };
}
