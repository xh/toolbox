import type {IconDefinition} from '@fortawesome/fontawesome-svg-core';
import type {HoistIconPrefix} from '@xh/hoist/icon';
import {clamp, isBoolean, isFinite, isString} from 'lodash';

/** Backdrop shape drawn behind the glyph. */
export type FaviconShape = 'none' | 'square' | 'rounded' | 'circle';

/** A complete favicon design - everything needed to render the output files. */
export interface FaviconSpec {
    /** Canonical FA `iconName` of the glyph. */
    iconName: string;
    /** Effective FA weight for the glyph. */
    prefix: HoistIconPrefix;
    /** Glyph color, as '#rrggbb' lowercase. */
    fgColor: string;
    /** Backdrop color. With shape 'none', used only for the apple icon and the config snippet. */
    bgColor: string;
    shape: FaviconShape;
    /** Corner radius, 0-50, as a % of the tile (rounded only). */
    radius: number;
    /** Inset from the visible shape edge, 0-40, as a % of the tile. */
    padding: number;
    /** Clockwise rotation in degrees, 0-359 integer. */
    rotation: number;
    flipH: boolean;
    flipV: boolean;
    /** Used for the zip name and mock labels - max 40 chars. */
    appName: string;
}

/** Glyph data extracted from an FA `IconDefinition`, in its native viewBox units. */
export interface Glyph {
    prefix: HoistIconPrefix;
    iconName: string;
    width: number;
    height: number;
    paths: string[];
}

export interface FaviconPreset extends Omit<FaviconSpec, 'appName'> {
    name: string;
}

export const SHAPES: FaviconShape[] = ['none', 'square', 'rounded', 'circle'];
export const PREFIXES: HoistIconPrefix[] = ['fas', 'far', 'fal', 'fat'];

export const MAX_RADIUS = 50;
export const MAX_PADDING = 40;
export const MAX_APP_NAME_LENGTH = 40;

export const DEFAULT_PADDING: Record<FaviconShape, number> = {
    none: 6,
    square: 14,
    rounded: 14,
    circle: 10
};

export const DEFAULT_RADIUS = 20;

export const PREFIX_LABELS: Partial<Record<HoistIconPrefix, string>> = {
    fas: 'Solid',
    far: 'Regular',
    fal: 'Light',
    fat: 'Thin'
};

/**
 * Default design - matches `FAVICON_PRESETS[0]` ('Hoist Classic'), inlined here to keep this module
 * free of an import cycle with `Presets.ts`.
 */
export const DEFAULT_SPEC: FaviconSpec = Object.freeze({
    iconName: 'rocket',
    prefix: 'fas',
    fgColor: '#263238',
    bgColor: '#f7931c',
    shape: 'rounded',
    radius: DEFAULT_RADIUS,
    padding: DEFAULT_PADDING.rounded,
    rotation: 0,
    flipH: false,
    flipV: false,
    appName: 'My App'
}) as FaviconSpec;

/** Normalize '#?rgb' or '#?rrggbb' (any case) to '#rrggbb' lowercase, or return null if invalid. */
export function normalizeHex(s: string): string | null {
    if (!isString(s)) return null;
    const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s.trim());
    if (!match) return null;

    let hex = match[1].toLowerCase();
    if (hex.length === 3) hex = hex.replace(/./g, c => c + c);
    return '#' + hex;
}

/**
 * Produce a complete, valid spec from a partial or untrusted one. Missing or invalid fields take
 * their `DEFAULT_SPEC` value; numbers are rounded and clamped, rotation is taken mod 360, colors are
 * normalized to lowercase '#rrggbb' and the app name is truncated to 40 chars.
 */
export function normalizeSpec(s: Partial<FaviconSpec>): FaviconSpec {
    s = s ?? {};
    const d = DEFAULT_SPEC;
    return {
        iconName: isString(s.iconName) && s.iconName.trim() ? s.iconName.trim() : d.iconName,
        prefix: PREFIXES.includes(s.prefix) ? s.prefix : d.prefix,
        fgColor: normalizeHex(s.fgColor) ?? d.fgColor,
        bgColor: normalizeHex(s.bgColor) ?? d.bgColor,
        shape: SHAPES.includes(s.shape) ? s.shape : d.shape,
        radius: clampInt(s.radius, 0, MAX_RADIUS, d.radius),
        padding: clampInt(s.padding, 0, MAX_PADDING, d.padding),
        rotation: isFinite(s.rotation) ? mod360(Math.round(s.rotation)) : d.rotation,
        flipH: isBoolean(s.flipH) ? s.flipH : d.flipH,
        flipV: isBoolean(s.flipV) ? s.flipV : d.flipV,
        appName: isString(s.appName) ? s.appName.slice(0, MAX_APP_NAME_LENGTH) : d.appName
    };
}

/** Extract a `Glyph` from an FA `IconDefinition` - `icon[4]` may be a single path or an array. */
export function glyphFromDefinition(def: IconDefinition): Glyph {
    const [width, height, , , pathData] = def.icon,
        paths = (Array.isArray(pathData) ? pathData : [pathData]).filter(p => isString(p) && p);

    return {
        prefix: def.prefix as HoistIconPrefix,
        iconName: def.iconName,
        width,
        height,
        paths
    };
}

//------------------
// Implementation
//------------------
function clampInt(v: number, min: number, max: number, fallback: number): number {
    return isFinite(v) ? clamp(Math.round(v), min, max) : fallback;
}

function mod360(v: number): number {
    const ret = ((v % 360) + 360) % 360;
    return ret === 0 ? 0 : ret; // avoid -0
}
