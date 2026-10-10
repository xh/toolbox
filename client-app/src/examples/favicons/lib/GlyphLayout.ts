import type {FaviconSpec, Glyph} from './FaviconSpec';
import type {Matrix, Seg} from './PathGeometry';
import {
    flipMatrix,
    glyphSegs,
    multiply,
    pathBounds,
    rotationMatrix,
    samplePath,
    scale,
    translate
} from './PathGeometry';

/** Side length of the square output tile, in SVG user units. */
export const TILE = 512;

export interface GlyphLayout {
    /** Maps glyph path coordinates into the 512 tile. */
    matrix: Matrix;
    /** Uniform scale factor applied to the glyph. */
    scale: number;
}

export type LayoutSpec = Pick<
    FaviconSpec,
    'shape' | 'radius' | 'padding' | 'rotation' | 'flipH' | 'flipV'
>;

/**
 * Fit and centre a glyph in the tile. Padding is the inset from the visible edge of the backdrop
 * shape, and the circle and rounded shapes fit the glyph's actual path rather than its bounding box.
 */
export function layoutGlyph(glyph: Glyph, s: LayoutSpec): GlyphLayout {
    const segs = glyphSegs(glyph),
        orient = multiply(rotationMatrix(s.rotation), flipMatrix(s.flipH, s.flipV)),
        b = pathBounds(segs, orient),
        cx = b.x + b.width / 2,
        cy = b.y + b.height / 2,
        width = b.width || 1,
        height = b.height || 1,
        pad = (s.padding / 100) * TILE,
        half = TILE / 2 - pad,
        kSquare = (2 * half) / Math.max(width, height);

    let k: number;
    switch (s.shape) {
        case 'circle':
            k = circleScale(segs, orient, cx, cy, half);
            break;
        case 'rounded': {
            const r = Math.max(0, (s.radius / 100) * TILE - pad);
            k = roundedScale(segs, orient, cx, cy, half, r, kSquare);
            break;
        }
        default:
            k = kSquare;
    }

    return {
        matrix: multiply(
            translate(TILE / 2 - k * cx, TILE / 2 - k * cy),
            multiply(scale(k), orient)
        ),
        scale: k
    };
}

/**
 * The layout used for the apple touch icon - always a full-bleed square, with the glyph fitted as if
 * inside a rounded square.
 */
export function appleLayoutSpec(spec: FaviconSpec): FaviconSpec {
    return {...spec, shape: 'rounded', radius: 22, padding: Math.max(spec.padding, 10)};
}

//------------------
// Implementation
//------------------
const CIRCLE_SAFETY = 1.002,
    BISECT_ITERATIONS = 30;

function maxDistance(pts: Float64Array, cx: number, cy: number): number {
    let max = 0;
    for (let i = 0; i < pts.length; i += 2) {
        const d = Math.hypot(pts[i] - cx, pts[i + 1] - cy);
        if (d > max) max = d;
    }
    return max || 1;
}

function circleScale(segs: Seg[], orient: Matrix, cx: number, cy: number, radius: number): number {
    return radius / (CIRCLE_SAFETY * maxDistance(samplePath(segs, orient), cx, cy));
}

/**
 * Largest scale at which every sampled point fits inside a rounded square of half-size `half` and
 * corner radius `r`, found by bisection between the circle fit and the square fit.
 */
function roundedScale(
    segs: Seg[],
    orient: Matrix,
    cx: number,
    cy: number,
    half: number,
    r: number,
    kSquare: number
): number {
    const pts = samplePath(segs, orient),
        inner = half - r,
        tol = 1e-9 * half;

    const feasible = (k: number) => {
        for (let i = 0; i < pts.length; i += 2) {
            const qx = Math.abs(k * (pts[i] - cx)),
                qy = Math.abs(k * (pts[i + 1] - cy));
            if (qx > half + tol || qy > half + tol) return false;
            if (qx > inner && qy > inner && Math.hypot(qx - inner, qy - inner) > r + tol) {
                return false;
            }
        }
        return true;
    };

    let lo = Math.min(half / (CIRCLE_SAFETY * maxDistance(pts, cx, cy)), kSquare),
        hi = kSquare;
    if (feasible(hi)) return hi;

    for (let i = 0; i < BISECT_ITERATIONS; i++) {
        const mid = (lo + hi) / 2;
        if (feasible(mid)) lo = mid;
        else hi = mid;
    }
    return lo;
}
