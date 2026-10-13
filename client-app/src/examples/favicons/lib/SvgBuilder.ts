import type {FaviconSpec, Glyph} from './FaviconSpec';
import {appleLayoutSpec, layoutGlyph, TILE} from './GlyphLayout';

export interface BuildFaviconSvgOpts {
    /** Output width and height attributes - default 512. The viewBox is always the 512 tile. */
    size?: number;
    /** 'apple' renders the touch icon - a full-bleed square with a rounded-square glyph fit. */
    variant?: 'main' | 'apple';
    /** Text for an XML comment within the SVG, e.g. the share URL. */
    comment?: string;
}

/** Build a standalone favicon SVG for a glyph and design. */
export function buildFaviconSvg(
    glyph: Glyph,
    spec: FaviconSpec,
    opts: BuildFaviconSvgOpts = {}
): string {
    const {size = TILE, variant = 'main', comment} = opts,
        isApple = variant === 'apple',
        layoutSpec = isApple ? appleLayoutSpec(spec) : spec,
        {matrix} = layoutGlyph(glyph, layoutSpec),
        transform = `matrix(${matrix.map(fmt).join(' ')})`,
        lines = [
            `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(size)}" height="${fmt(size)}" viewBox="0 0 ${TILE} ${TILE}">`
        ];

    if (comment) lines.push(`<!-- ${comment.replace(/-{2,}/g, '-')} -->`);

    const backdrop = isApple ? squareRect(spec.bgColor) : backdropFor(spec);
    if (backdrop) lines.push(backdrop);

    for (const d of glyph.paths) {
        lines.push(`<path fill="${spec.fgColor}" transform="${transform}" d="${d}"/>`);
    }

    lines.push('</svg>');
    return lines.join('\n');
}

export function svgToDataUrl(svg: string): string {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

//------------------
// Implementation
//------------------
/** Format a number with at most 4 decimals and no trailing zeros, writing -0 as 0. */
function fmt(n: number): string {
    const ret = +n.toFixed(4);
    return String(ret === 0 ? 0 : ret);
}

function squareRect(fill: string): string {
    return `<rect width="${TILE}" height="${TILE}" fill="${fill}"/>`;
}

function backdropFor(spec: FaviconSpec): string {
    const {shape, bgColor, radius} = spec,
        half = TILE / 2;
    switch (shape) {
        case 'square':
            return squareRect(bgColor);
        case 'rounded':
            return `<rect width="${TILE}" height="${TILE}" rx="${fmt((radius / 100) * TILE)}" fill="${bgColor}"/>`;
        case 'circle':
            return `<circle cx="${half}" cy="${half}" r="${half}" fill="${bgColor}"/>`;
        default:
            return null;
    }
}
