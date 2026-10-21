import {clamp} from 'lodash';
import {normalizeHex} from './FaviconSpec';

/** Light and dark foreground candidates offered by `readableFgFor`. */
export const LIGHT_FG = '#ffffff';
export const DARK_FG = '#212121';

/**
 * WCAG 2.x contrast ratio between two colors, from 1 (identical luminance) to 21 (black on white).
 * Accepts any color `normalizeHex` accepts - an invalid color is treated as black.
 */
export function contrastRatio(a: string, b: string): number {
    const la = relativeLuminance(a),
        lb = relativeLuminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** The foreground - white or near-black - that contrasts more with the given background. */
export function readableFgFor(bg: string): string {
    return contrastRatio(bg, LIGHT_FG) >= contrastRatio(bg, DARK_FG) ? LIGHT_FG : DARK_FG;
}

/**
 * Convert HSL to '#rrggbb' lowercase.
 * @param h - hue in degrees, taken mod 360.
 * @param s - saturation in percent, 0-100.
 * @param l - lightness in percent, 0-100.
 */
export function hslToHex(h: number, s: number, l: number): string {
    h = (((h % 360) + 360) % 360) / 360;
    s = clamp(s, 0, 100) / 100;
    l = clamp(l, 0, 100) / 100;

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s,
        p = 2 * l - q,
        channel = (t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            let v: number;
            if (t < 1 / 6) v = p + (q - p) * 6 * t;
            else if (t < 1 / 2) v = q;
            else if (t < 2 / 3) v = p + (q - p) * (2 / 3 - t) * 6;
            else v = p;
            return Math.round(v * 255)
                .toString(16)
                .padStart(2, '0');
        };

    return '#' + channel(h + 1 / 3) + channel(h) + channel(h - 1 / 3);
}

//------------------
// Implementation
//------------------
function relativeLuminance(color: string): number {
    const hex = normalizeHex(color) ?? '#000000',
        [r, g, b] = [1, 3, 5].map(i => {
            const c = parseInt(hex.slice(i, i + 2), 16) / 255;
            return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
