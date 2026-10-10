import type {HoistIconPrefix} from '@xh/hoist/icon';
import {hslToHex, readableFgFor} from './Colors';
import type {FaviconPreset, FaviconShape, FaviconSpec} from './FaviconSpec';
import {DEFAULT_PADDING, DEFAULT_RADIUS, normalizeSpec} from './FaviconSpec';

/**
 * Curated starting designs. The first ('Hoist Classic') is also the app default - keep it in sync
 * with `DEFAULT_SPEC`. All use rotation 0 and no flips; `radius` is used only for 'rounded'.
 */
export const FAVICON_PRESETS: FaviconPreset[] = [
    preset('Hoist Classic', 'rocket', 'fas', '#263238', '#f7931c', 'rounded'),
    preset('House Style', 'bolt', 'fas', '#f7931c', '#ffffff', 'none'),
    preset('Trading Desk', 'chart-line', 'fas', '#ffffff', '#1976d2', 'square'),
    preset('Ledger', 'scale-balanced', 'fal', '#263238', '#eceff1', 'circle'),
    preset('Go Green', 'leaf', 'fas', '#ffffff', '#2e7d32', 'circle'),
    preset('Midnight', 'moon-stars', 'fas', '#f7931c', '#263238', 'rounded', 30)
];

/**
 * Generate a random but tasteful design. Deterministic for a given `rng` sequence.
 *
 * @param rng - source of uniform randoms in [0, 1), e.g. `Math.random`.
 * @param names - candidate canonical glyph names, as from `allIconNames()`.
 * @param current - the current design - its `appName` is kept, and its glyph is reused if `names`
 *      is empty.
 */
export function randomSpec(rng: () => number, names: string[], current: FaviconSpec): FaviconSpec {
    let iconName: string, prefix: HoistIconPrefix;
    if (names.length) {
        iconName = pick(rng, names);
        prefix = rng() < 0.5 ? 'fas' : pick(rng, ['far', 'fal', 'fat'] as HoistIconPrefix[]);
    } else {
        iconName = current.iconName;
        prefix = current.prefix;
    }

    const hue = hslToHex(rng() * 360, 55 + rng() * 25, 35 + rng() * 15),
        shapeRoll = rng(),
        shape: FaviconShape =
            shapeRoll < 0.45
                ? 'rounded'
                : shapeRoll < 0.7
                  ? 'circle'
                  : shapeRoll < 0.9
                    ? 'square'
                    : 'none';

    // With no backdrop the glyph itself carries the hue. `bgColor` is then used only for the apple
    // icon and the config snippet, so give it a readable contrast to the glyph.
    const fgColor = shape === 'none' ? hue : readableFgFor(hue),
        bgColor = shape === 'none' ? readableFgFor(hue) : hue;

    return normalizeSpec({
        iconName,
        prefix,
        fgColor,
        bgColor,
        shape,
        radius: DEFAULT_RADIUS,
        padding: DEFAULT_PADDING[shape],
        rotation: 0,
        flipH: false,
        flipV: false,
        appName: current.appName
    });
}

//------------------
// Implementation
//------------------
function preset(
    name: string,
    iconName: string,
    prefix: HoistIconPrefix,
    fgColor: string,
    bgColor: string,
    shape: FaviconShape,
    radius: number = DEFAULT_RADIUS
): FaviconPreset {
    return {
        name,
        iconName,
        prefix,
        fgColor,
        bgColor,
        shape,
        radius,
        padding: DEFAULT_PADDING[shape],
        rotation: 0,
        flipH: false,
        flipV: false
    };
}

function pick<T>(rng: () => number, items: T[]): T {
    return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
}
