import type {HoistIconPrefix} from '@xh/hoist/icon';
import type {FaviconShape, FaviconSpec} from './FaviconSpec';
import {normalizeSpec} from './FaviconSpec';

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
        ['name', s.appName]
    ]).toString();
}

/**
 * Parse a design from a query string (leading '?' optional). Missing or invalid values take their
 * default, out-of-range numbers are clamped and unknown params are ignored. Whether the icon exists
 * is left to the caller.
 */
export function decodeSpec(search: string): FaviconSpec {
    const params = new URLSearchParams(search ?? ''),
        str = (key: string) => params.get(key) ?? undefined,
        num = (key: string) => (params.has(key) ? parseFloat(params.get(key)) : undefined);

    return normalizeSpec({
        iconName: str('icon'),
        prefix: str('w') as HoistIconPrefix,
        fgColor: str('fg'),
        bgColor: str('bg'),
        shape: str('shape') as FaviconShape,
        radius: num('r'),
        padding: num('pad'),
        appName: str('name')
    });
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
