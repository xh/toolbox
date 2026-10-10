import type {HoistIconPrefix} from '@xh/hoist/icon';
import type {FaviconShape, FaviconSpec} from './FaviconSpec';
import {
    DEFAULT_SPEC,
    MAX_APP_NAME_LENGTH,
    MAX_PADDING,
    MAX_RADIUS,
    normalizeHex,
    normalizeSpec,
    PREFIXES,
    SHAPES
} from './FaviconSpec';

/**
 * Serialize a design as a readable query string (no leading '?'). Every field is always written,
 * so a shared link keeps its meaning even if the app's defaults later change.
 */
export function encodeSpec(spec: FaviconSpec): string {
    const s = normalizeSpec(spec);
    return new URLSearchParams([
        ['icon', s.iconName],
        ['w', s.prefix],
        ['fg', s.fgColor.slice(1)],
        ['bg', s.bgColor.slice(1)],
        ['shape', s.shape],
        ['r', String(s.radius)],
        ['pad', String(s.padding)],
        ['rot', String(s.rotation)],
        ['flip', (s.flipH ? 'h' : '') + (s.flipV ? 'v' : '') || 'none'],
        ['name', s.appName]
    ]).toString();
}

/**
 * Parse a design from a query string (leading '?' optional). Missing keys silently take their
 * default, invalid values take their default and add a warning, out-of-range numbers are clamped
 * and unknown params are ignored. Whether the icon exists is left to the caller.
 */
export function decodeSpec(search: string): {spec: FaviconSpec; warnings: string[]} {
    const params = new URLSearchParams(search ?? ''),
        warnings: string[] = [],
        ret: Partial<FaviconSpec> = {};

    const read = <T>(key: string, parse: (v: string) => T | undefined, apply: (v: T) => void) => {
        if (!params.has(key)) return;
        const raw = params.get(key),
            val = parse(raw);
        if (val === undefined) {
            warnings.push(`Ignored invalid value for '${key}': '${raw}'.`);
        } else {
            apply(val);
        }
    };

    read('icon', parseIconName, v => (ret.iconName = v));
    read('w', parsePrefix, v => (ret.prefix = v));
    read('fg', parseColor, v => (ret.fgColor = v));
    read('bg', parseColor, v => (ret.bgColor = v));
    read('shape', parseShape, v => (ret.shape = v));
    read('r', parseInteger, v => (ret.radius = Math.min(Math.max(v, 0), MAX_RADIUS)));
    read('pad', parseInteger, v => (ret.padding = Math.min(Math.max(v, 0), MAX_PADDING)));
    read('rot', parseInteger, v => (ret.rotation = v));
    read('flip', parseFlip, v => Object.assign(ret, v));
    read(
        'name',
        v => v,
        v => (ret.appName = v.slice(0, MAX_APP_NAME_LENGTH))
    );

    return {spec: normalizeSpec({...DEFAULT_SPEC, ...ret}), warnings};
}

/** Absolute URL that reopens the app with the given design. */
export function buildShareUrl(
    spec: FaviconSpec,
    loc: Pick<Location, 'origin' | 'pathname'> = window.location
): string {
    return `${loc.origin}${loc.pathname}?${encodeSpec(spec)}`;
}

/** Replace the current URL's query with the given design, without adding a history entry. */
export function writeSpecToUrl(spec: FaviconSpec): void {
    const {pathname, hash} = window.location;
    window.history.replaceState(window.history.state, '', `${pathname}?${encodeSpec(spec)}${hash}`);
}

//------------------
// Implementation
//------------------
function parseIconName(v: string): string | undefined {
    return /^[a-z0-9-]{1,64}$/.test(v) ? v : undefined;
}

function parsePrefix(v: string): HoistIconPrefix | undefined {
    return PREFIXES.find(it => it === v);
}

function parseColor(v: string): string | undefined {
    return /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? normalizeHex(v) : undefined;
}

function parseShape(v: string): FaviconShape | undefined {
    return SHAPES.find(it => it === v);
}

function parseInteger(v: string): number | undefined {
    return /^[+-]?\d{1,6}$/.test(v) ? parseInt(v, 10) : undefined;
}

function parseFlip(v: string): Pick<FaviconSpec, 'flipH' | 'flipV'> | undefined {
    switch (v) {
        case 'none':
            return {flipH: false, flipV: false};
        case 'h':
            return {flipH: true, flipV: false};
        case 'v':
            return {flipH: false, flipV: true};
        case 'hv':
            return {flipH: true, flipV: true};
        default:
            return undefined;
    }
}
