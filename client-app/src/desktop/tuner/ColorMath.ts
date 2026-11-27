/**
 * Color math for the theme tuner: compositing, WCAG 2.x contrast, APCA Lc and OKLCH conversion.
 * Channels are sRGB 0-255, alpha is 0-1.
 */
export interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface Oklch {
    l: number;
    c: number;
    /** Null for colors with no meaningful hue. */
    h: number;
}

/** Composite a translucent color over an opaque backdrop (source-over, in sRGB). */
export function over(fg: Rgba, bg: Rgba): Rgba {
    const a = fg.a;
    return {
        r: fg.r * a + bg.r * (1 - a),
        g: fg.g * a + bg.g * (1 - a),
        b: fg.b * a + bg.b * (1 - a),
        a: a + bg.a * (1 - a)
    };
}

export function toHex(c: Rgba): string {
    const h = (v: number) =>
        Math.max(0, Math.min(255, Math.round(v)))
            .toString(16)
            .padStart(2, '0');
    return '#' + h(c.r) + h(c.g) + h(c.b);
}

/** CSS color string for a measured color: hex when opaque, `rgb(r g b / a)` otherwise. */
export function toCss(c: Rgba): string {
    if (c.a >= 0.9995) return toHex(c);
    const n = (v: number) => Math.round(v);
    return `rgb(${n(c.r)} ${n(c.g)} ${n(c.b)} / ${+c.a.toFixed(3)})`;
}

const toLinear = (v: number) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const fromLinear = (v: number) =>
    255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);

function relLum(c: Rgba): number {
    return 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b);
}

/** WCAG 2.x contrast ratio. Both colors must be opaque. */
export function wcag(fg: Rgba, bg: Rgba): number {
    const a = relLum(fg),
        b = relLum(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// APCA-W3 0.0.98G-4g constants, from github.com/Myndex/apca-w3.
const APCA = {
    mainTRC: 2.4,
    sRco: 0.2126729,
    sGco: 0.7151522,
    sBco: 0.072175,
    normBG: 0.56,
    normTXT: 0.57,
    revTXT: 0.62,
    revBG: 0.65,
    blkThrs: 0.022,
    blkClmp: 1.414,
    scaleBoW: 1.14,
    scaleWoB: 1.14,
    loBoWoffset: 0.027,
    loWoBoffset: 0.027,
    deltaYmin: 0.0005,
    loClip: 0.1
};

function apcaY(c: Rgba): number {
    const f = (v: number) => Math.pow(Math.max(0, Math.min(255, v)) / 255, APCA.mainTRC);
    return APCA.sRco * f(c.r) + APCA.sGco * f(c.g) + APCA.sBco * f(c.b);
}

/** APCA Lc. Positive for dark text on a light background, negative for the reverse. */
export function apca(txt: Rgba, bg: Rgba): number {
    const clamp = (y: number) =>
        y > APCA.blkThrs ? y : y + Math.pow(APCA.blkThrs - y, APCA.blkClmp);
    const yt = clamp(apcaY(txt)),
        yb = clamp(apcaY(bg));
    if (Math.abs(yb - yt) < APCA.deltaYmin) return 0;
    let out: number;
    if (yb > yt) {
        const s = (Math.pow(yb, APCA.normBG) - Math.pow(yt, APCA.normTXT)) * APCA.scaleBoW;
        out = s < APCA.loClip ? 0 : s - APCA.loBoWoffset;
    } else {
        const s = (Math.pow(yb, APCA.revBG) - Math.pow(yt, APCA.revTXT)) * APCA.scaleWoB;
        out = s > -APCA.loClip ? 0 : s + APCA.loWoBoffset;
    }
    return out * 100;
}

/** sRGB to OKLCH, using Bjorn Ottosson's OKLab matrices. */
export function toOklch(c: Rgba): Oklch {
    const r = toLinear(c.r),
        g = toLinear(c.g),
        b = toLinear(c.b);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b),
        m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b),
        s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    const C = Math.sqrt(A * A + B * B);
    let H = (Math.atan2(B, A) * 180) / Math.PI;
    if (H < 0) H += 360;
    return {l: L, c: C, h: C < 0.002 ? null : H};
}

/** OKLCH to sRGB. `inGamut` is false when the color had to be clipped to fit sRGB. */
export function fromOklch(o: Oklch, alpha = 1): Rgba & {inGamut: boolean} {
    const hr = ((o.h ?? 0) * Math.PI) / 180,
        A = o.c * Math.cos(hr),
        B = o.c * Math.sin(hr);
    const l = Math.pow(o.l + 0.3963377774 * A + 0.2158037573 * B, 3),
        m = Math.pow(o.l - 0.1055613458 * A - 0.0638541728 * B, 3),
        s = Math.pow(o.l - 0.0894841775 * A - 1.291485548 * B, 3);
    const lin = [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
    ];
    const eps = 0.0005,
        inGamut = lin.every(v => v >= -eps && v <= 1 + eps),
        [r, g, b] = lin.map(v => fromLinear(Math.max(0, Math.min(1, v))));
    return {r, g, b, a: alpha, inGamut};
}

/** Compact OKLCH readout, e.g. `96.8% .004 232`. */
export function fmtOklch(c: Rgba): string {
    const o = toOklch(c);
    return `${(o.l * 100).toFixed(1)}% ${o.c.toFixed(3).replace(/^0/, '')} ${o.h == null ? '-' : o.h.toFixed(0)}`;
}

/** CSS `oklch()` string for a measured color, rounded for hand-editing. */
export function toOklchCss(c: Rgba): string {
    const o = toOklch(c),
        base = `${+(o.l * 100).toFixed(1)}% ${+o.c.toFixed(3)} ${o.h == null ? 0 : +o.h.toFixed(0)}`;
    return c.a >= 0.9995 ? `oklch(${base})` : `oklch(${base} / ${+c.a.toFixed(3)})`;
}
