import type {Glyph} from './FaviconSpec';

/**
 * Pure SVG path geometry for laying out FA glyphs - parsing, exact bounds, sampling and affine
 * matrices. Computed in plain TypeScript (not via `getBBox`) so it runs under jsdom in unit tests.
 */

/** An SVG affine matrix `[a b c d e f]`, mapping (x, y) to (a·x + c·y + e, b·x + d·y + f). */
export type Matrix = [number, number, number, number, number, number];

/** A normalized, absolute path segment. */
export type Seg =
    | ['M', number, number]
    | ['L', number, number]
    | ['C', number, number, number, number, number, number]
    | ['Z'];

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/**
 * Split path data into command letters and numbers. Arc flags are read as single `0`/`1`
 * characters, so packed forms such as `A5 5 0 1110 0` parse correctly.
 */
export function tokenizePath(d: string): (string | number)[] {
    const out: (string | number)[] = [],
        n = d.length,
        numRe = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y,
        wsRe = /[\s,]*/y;

    let i = 0,
        cmd: string = null,
        argIdx = 0;

    while (true) {
        wsRe.lastIndex = i;
        wsRe.exec(d);
        i = wsRe.lastIndex;
        if (i >= n) break;

        const ch = d[i];
        if (/[a-zA-Z]/.test(ch)) {
            if (ARGC[ch.toLowerCase()] === undefined) throw badPath(d, i);
            cmd = ch;
            out.push(ch);
            i++;
            argIdx = 0;
            continue;
        }

        if (cmd?.toLowerCase() === 'a' && (argIdx % 7 === 3 || argIdx % 7 === 4)) {
            if (ch !== '0' && ch !== '1') throw badPath(d, i);
            out.push(+ch);
            i++;
            argIdx++;
            continue;
        }

        numRe.lastIndex = i;
        const match = numRe.exec(d);
        if (!match) throw badPath(d, i);
        out.push(parseFloat(match[0]));
        i = numRe.lastIndex;
        argIdx++;
    }

    return out;
}

/**
 * Parse path data into absolute `M`/`L`/`C`/`Z` segments. H/V become lines, S/T control points are
 * reflected, quadratics are raised to cubics and arcs are converted to cubics of at most 90° each.
 */
export function normalizePath(d: string): Seg[] {
    const t = tokenizePath(d),
        out: Seg[] = [];

    let i = 0,
        cmd: string = null,
        x = 0,
        y = 0,
        sx = 0,
        sy = 0,
        lastC: [number, number] = null, // last cubic control point, for S
        lastQ: [number, number] = null; // last quadratic control point, for T

    while (i < t.length) {
        if (typeof t[i] === 'string') {
            cmd = t[i++] as string;
        } else if (cmd == null) {
            throw new Error(`Invalid path data - must start with a command: '${d.slice(0, 20)}'`);
        }

        const c = cmd.toLowerCase(),
            rel = cmd !== cmd.toUpperCase(),
            argc = ARGC[c];

        // A number following a zero-arg command (z) can never be consumed.
        if (argc === 0 && typeof t[i] === 'number') {
            throw new Error(`Invalid path data - unexpected number after '${cmd}'`);
        }
        if (i + argc > t.length) throw new Error(`Invalid path data - too few args for '${cmd}'`);

        const a = t.slice(i, i + argc) as number[];
        if (a.some(v => typeof v !== 'number')) {
            throw new Error(`Invalid path data - too few args for '${cmd}'`);
        }
        i += argc;

        const ox = rel ? x : 0,
            oy = rel ? y : 0;
        let nextC: [number, number] = null,
            nextQ: [number, number] = null;

        switch (c) {
            case 'z':
                out.push(['Z']);
                x = sx;
                y = sy;
                break;
            case 'm':
                x = a[0] + ox;
                y = a[1] + oy;
                sx = x;
                sy = y;
                out.push(['M', x, y]);
                // Further coordinate pairs are implicit linetos.
                cmd = rel ? 'l' : 'L';
                break;
            case 'l':
                x = a[0] + ox;
                y = a[1] + oy;
                out.push(['L', x, y]);
                break;
            case 'h':
                x = a[0] + ox;
                out.push(['L', x, y]);
                break;
            case 'v':
                y = a[0] + oy;
                out.push(['L', x, y]);
                break;
            case 'c': {
                const [x1, y1, x2, y2, ex, ey] = [
                    a[0] + ox,
                    a[1] + oy,
                    a[2] + ox,
                    a[3] + oy,
                    a[4] + ox,
                    a[5] + oy
                ];
                out.push(['C', x1, y1, x2, y2, ex, ey]);
                nextC = [x2, y2];
                x = ex;
                y = ey;
                break;
            }
            case 's': {
                const x1 = lastC ? 2 * x - lastC[0] : x,
                    y1 = lastC ? 2 * y - lastC[1] : y,
                    x2 = a[0] + ox,
                    y2 = a[1] + oy,
                    ex = a[2] + ox,
                    ey = a[3] + oy;
                out.push(['C', x1, y1, x2, y2, ex, ey]);
                nextC = [x2, y2];
                x = ex;
                y = ey;
                break;
            }
            case 'q':
            case 't': {
                let qx: number, qy: number, ex: number, ey: number;
                if (c === 'q') {
                    [qx, qy, ex, ey] = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy];
                } else {
                    qx = lastQ ? 2 * x - lastQ[0] : x;
                    qy = lastQ ? 2 * y - lastQ[1] : y;
                    [ex, ey] = [a[0] + ox, a[1] + oy];
                }
                out.push([
                    'C',
                    x + (2 / 3) * (qx - x),
                    y + (2 / 3) * (qy - y),
                    ex + (2 / 3) * (qx - ex),
                    ey + (2 / 3) * (qy - ey),
                    ex,
                    ey
                ]);
                nextQ = [qx, qy];
                x = ex;
                y = ey;
                break;
            }
            case 'a': {
                const ex = a[5] + ox,
                    ey = a[6] + oy;
                out.push(...arcToSegs(x, y, a[0], a[1], a[2], a[3], a[4], ex, ey));
                x = ex;
                y = ey;
                break;
            }
        }

        lastC = nextC;
        lastQ = nextQ;
    }

    return out;
}

/** Normalized segments for all of a glyph's paths, memoized by `${prefix}:${iconName}`. */
export function glyphSegs(glyph: Glyph): Seg[] {
    const key = `${glyph.prefix}:${glyph.iconName}`;
    let ret = segCache.get(key);
    if (!ret) {
        // Normalize each path separately - each starts fresh at (0, 0).
        ret = glyph.paths.flatMap(p => normalizePath(p));
        segCache.set(key, ret);
    }
    return ret;
}

/**
 * Exact bounds of the segments after transforming by `m`. Control points are transformed first,
 * then each cubic's extrema are found per axis by solving its derivative.
 */
export function pathBounds(segs: Seg[], m: Matrix = IDENTITY): Bounds {
    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity,
        cur: [number, number] = [m[4], m[5]];

    const add = (px: number, py: number) => {
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
    };

    for (const s of segs) {
        if (s[0] === 'M' || s[0] === 'L') {
            cur = applyMatrix(m, s[1], s[2]);
            add(cur[0], cur[1]);
        } else if (s[0] === 'C') {
            const p0 = cur,
                p1 = applyMatrix(m, s[1], s[2]),
                p2 = applyMatrix(m, s[3], s[4]),
                p3 = applyMatrix(m, s[5], s[6]);
            add(p3[0], p3[1]);
            for (const dim of [0, 1]) {
                for (const t of cubicExtrema(p0[dim], p1[dim], p2[dim], p3[dim])) {
                    add(
                        cubicAt(p0[0], p1[0], p2[0], p3[0], t),
                        cubicAt(p0[1], p1[1], p2[1], p3[1], t)
                    );
                }
            }
            cur = p3;
        }
    }

    if (minX === Infinity) return {x: 0, y: 0, width: 0, height: 0};
    return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
}

/**
 * Points along the segments after transforming by `m`, as a flat `[x0, y0, x1, y1, ...]` array:
 * every `M`/`L` point, plus `perCurve` evenly spaced points (ending at the endpoint) per cubic.
 */
export function samplePath(segs: Seg[], m: Matrix = IDENTITY, perCurve: number = 16): Float64Array {
    let count = 0;
    for (const s of segs) {
        if (s[0] === 'M' || s[0] === 'L') count++;
        else if (s[0] === 'C') count += perCurve;
    }

    const out = new Float64Array(count * 2);
    let i = 0,
        cur: [number, number] = [m[4], m[5]];

    for (const s of segs) {
        if (s[0] === 'M' || s[0] === 'L') {
            cur = applyMatrix(m, s[1], s[2]);
            out[i++] = cur[0];
            out[i++] = cur[1];
        } else if (s[0] === 'C') {
            const p0 = cur,
                p1 = applyMatrix(m, s[1], s[2]),
                p2 = applyMatrix(m, s[3], s[4]),
                p3 = applyMatrix(m, s[5], s[6]);
            for (let j = 1; j <= perCurve; j++) {
                const t = j / perCurve;
                out[i++] = cubicAt(p0[0], p1[0], p2[0], p3[0], t);
                out[i++] = cubicAt(p0[1], p1[1], p2[1], p3[1], t);
            }
            cur = p3;
        }
    }

    return out;
}

/** Matrix product `a · b` - the result applies `b` first, then `a`. */
export function multiply(a: Matrix, b: Matrix): Matrix {
    return [
        a[0] * b[0] + a[2] * b[1],
        a[1] * b[0] + a[3] * b[1],
        a[0] * b[2] + a[2] * b[3],
        a[1] * b[2] + a[3] * b[3],
        a[0] * b[4] + a[2] * b[5] + a[4],
        a[1] * b[4] + a[3] * b[5] + a[5]
    ];
}

/** Rotation about the origin, clockwise on screen (SVG's y axis points down). */
export function rotationMatrix(deg: number): Matrix {
    const norm = ((deg % 360) + 360) % 360;
    // Exact values for right angles, avoiding floating-point noise such as cos(90°) = 6e-17.
    const exact = {0: [1, 0], 90: [0, 1], 180: [-1, 0], 270: [0, -1]}[norm],
        rad = (norm * Math.PI) / 180,
        [cos, sin] = exact ?? [Math.cos(rad), Math.sin(rad)];
    return [cos, sin, -sin, cos, 0, 0];
}

/** Mirror about the origin - horizontally (x → -x) and/or vertically (y → -y). */
export function flipMatrix(flipH: boolean, flipV: boolean): Matrix {
    return [flipH ? -1 : 1, 0, 0, flipV ? -1 : 1, 0, 0];
}

export function translate(x: number, y: number): Matrix {
    return [1, 0, 0, 1, x, y];
}

export function scale(k: number): Matrix {
    return [k, 0, 0, k, 0, 0];
}

export function applyMatrix(m: Matrix, x: number, y: number): [number, number] {
    return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

//------------------
// Implementation
//------------------
const ARGC: Record<string, number> = {m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0};

const segCache = new Map<string, Seg[]>();

function badPath(d: string, i: number): Error {
    return new Error(`Invalid path data at ${i}: '${d.slice(i, i + 10)}'`);
}

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/** Parameters t in (0, 1) where a 1D cubic's derivative is zero. */
function cubicExtrema(p0: number, p1: number, p2: number, p3: number): number[] {
    // B'(t)/3 = a·t² + b·t + c
    const a = -p0 + 3 * p1 - 3 * p2 + p3,
        b = 2 * (p0 - 2 * p1 + p2),
        c = p1 - p0,
        ret: number[] = [];

    if (Math.abs(a) < 1e-12) {
        if (Math.abs(b) > 1e-12) ret.push(-c / b);
    } else {
        const disc = b * b - 4 * a * c;
        if (disc >= 0) {
            const sq = Math.sqrt(disc);
            ret.push((-b + sq) / (2 * a), (-b - sq) / (2 * a));
        }
    }
    return ret.filter(t => t > 0 && t < 1);
}

/** Convert an SVG arc to cubics (or a line, for a zero radius), per SVG spec F.6.5. */
function arcToSegs(
    x1: number,
    y1: number,
    rx: number,
    ry: number,
    phiDeg: number,
    largeArc: number,
    sweep: number,
    x2: number,
    y2: number
): Seg[] {
    if (x1 === x2 && y1 === y2) return [];
    if (rx === 0 || ry === 0) return [['L', x2, y2]];

    rx = Math.abs(rx);
    ry = Math.abs(ry);
    const phi = (phiDeg * Math.PI) / 180,
        cp = Math.cos(phi),
        sp = Math.sin(phi),
        dx = (x1 - x2) / 2,
        dy = (y1 - y2) / 2,
        x1p = cp * dx + sp * dy,
        y1p = -sp * dx + cp * dy;

    // Scale up radii too small to span the endpoints.
    const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lambda > 1) {
        const s = Math.sqrt(lambda);
        rx *= s;
        ry *= s;
    }

    const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p,
        den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    let co = Math.sqrt(Math.max(0, num / den));
    if (largeArc === sweep) co = -co;

    const cxp = (co * rx * y1p) / ry,
        cyp = (-co * ry * x1p) / rx,
        cx = cp * cxp - sp * cyp + (x1 + x2) / 2,
        cy = sp * cxp + cp * cyp + (y1 + y2) / 2;

    const angle = (ux: number, uy: number, vx: number, vy: number) =>
        Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);

    const ux = (x1p - cxp) / rx,
        uy = (y1p - cyp) / ry,
        theta1 = angle(1, 0, ux, uy);
    let delta = angle(ux, uy, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!sweep && delta > 0) delta -= 2 * Math.PI;
    else if (sweep && delta < 0) delta += 2 * Math.PI;

    const pieces = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2) - 1e-9)),
        d = delta / pieces,
        k = (4 / 3) * Math.tan(d / 4),
        pt = (t: number) => {
            const c = Math.cos(t),
                s = Math.sin(t);
            return [cx + rx * c * cp - ry * s * sp, cy + rx * c * sp + ry * s * cp];
        },
        deriv = (t: number) => {
            const c = Math.cos(t),
                s = Math.sin(t);
            return [-rx * s * cp - ry * c * sp, -rx * s * sp + ry * c * cp];
        },
        ret: Seg[] = [];

    for (let j = 0; j < pieces; j++) {
        const a = theta1 + j * d,
            b = a + d,
            p0 = pt(a),
            d0 = deriv(a),
            d3 = deriv(b),
            // Land the final piece exactly on the arc's endpoint.
            p3 = j === pieces - 1 ? [x2, y2] : pt(b);
        ret.push([
            'C',
            p0[0] + k * d0[0],
            p0[1] + k * d0[1],
            p3[0] - k * d3[0],
            p3[1] - k * d3[1],
            p3[0],
            p3[1]
        ]);
    }
    return ret;
}
