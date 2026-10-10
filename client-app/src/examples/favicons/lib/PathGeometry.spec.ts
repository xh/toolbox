import type {IconDefinition, IconPack} from '@fortawesome/fontawesome-svg-core';
import {faCircle, faGear, far} from '@fortawesome/pro-regular-svg-icons';
import {fas} from '@fortawesome/pro-solid-svg-icons';
import {describe, expect, it} from 'vitest';
import {glyphFromDefinition} from './FaviconSpec';
import type {Bounds, Matrix, Seg} from './PathGeometry';
import {
    applyMatrix,
    flipMatrix,
    glyphSegs,
    IDENTITY,
    multiply,
    normalizePath,
    pathBounds,
    rotationMatrix,
    samplePath,
    scale,
    tokenizePath,
    translate
} from './PathGeometry';

describe('tokenizePath', () => {
    it('splits packed numbers with implied separators and exponents', () => {
        expect(tokenizePath('M1.5.5l-.8-1.2e1')).toEqual(['M', 1.5, 0.5, 'l', -0.8, -12]);
    });

    it('reads packed arc flags as single characters', () => {
        expect(tokenizePath('A5 5 0 1110 0')).toEqual(['A', 5, 5, 0, 1, 1, 10, 0]);
        // Repeated implicit arcs keep tracking the flag positions.
        expect(tokenizePath('a1 1 0 00 2 0 1 1 0 112 0')).toEqual([
            'a',
            1,
            1,
            0,
            0,
            0,
            2,
            0,
            1,
            1,
            0,
            1,
            1,
            2,
            0
        ]);
    });

    it('rejects invalid input', () => {
        expect(() => tokenizePath('M0 0 L1 #')).toThrow();
        expect(() => tokenizePath('A5 5 0 2 0 10 0')).toThrow();
        expect(() => tokenizePath('M0 0 X1 1')).toThrow();
    });
});

describe('normalizePath', () => {
    it('treats coordinates after M/m as implicit linetos', () => {
        expect(normalizePath('M0 0 10 10 20 0')).toEqual([
            ['M', 0, 0],
            ['L', 10, 10],
            ['L', 20, 0]
        ]);
        expect(normalizePath('m1 1 2 2 1 0')).toEqual([
            ['M', 1, 1],
            ['L', 3, 3],
            ['L', 4, 3]
        ]);
    });

    it('returns to the subpath start on z, for a following relative m', () => {
        expect(normalizePath('M10 10L20 10L20 20zm5 5l1 0')).toEqual([
            ['M', 10, 10],
            ['L', 20, 10],
            ['L', 20, 20],
            ['Z'],
            ['M', 15, 15],
            ['L', 16, 15]
        ]);
    });

    it('converts H and V to lines', () => {
        expect(normalizePath('M10 10H50V30h-10v-5')).toEqual([
            ['M', 10, 10],
            ['L', 50, 10],
            ['L', 50, 30],
            ['L', 40, 30],
            ['L', 40, 25]
        ]);
    });

    it('reflects the previous cubic control point for S', () => {
        const segs = normalizePath('M0 0C10 0 20 10 30 10S50 20 60 20');
        expect(segs[2]).toEqual(['C', 40, 10, 50, 20, 60, 20]);
    });

    it('uses the current point as the first control for S without a prior cubic', () => {
        const segs = normalizePath('M0 0L30 10S50 20 60 20');
        expect(segs[2]).toEqual(['C', 30, 10, 50, 20, 60, 20]);
    });

    it('raises Q to a cubic and reflects the previous quadratic control point for T', () => {
        const segs = normalizePath('M0 0Q10 10 20 0T40 0');
        expectSegClose(segs[1], ['C', 20 / 3, 20 / 3, 20 - 20 / 3, 20 / 3, 20, 0]);
        // Reflected control point is (30, -10).
        expectSegClose(segs[2], ['C', 20 + 20 / 3, -20 / 3, 40 - 20 / 3, -20 / 3, 40, 0]);
    });

    it('converts a zero-radius arc to a line', () => {
        expect(normalizePath('M0 0A0 10 0 0 1 100 50')).toEqual([
            ['M', 0, 0],
            ['L', 100, 50]
        ]);
    });

    it('splits arcs into cubics of at most 90 degrees, ending exactly on the endpoint', () => {
        const segs = normalizePath('M0 50A50 50 0 1 1 100 50');
        expect(segs.length).toBe(3); // M + two 90° pieces for a 180° arc
        expect(segs[2].slice(5)).toEqual([100, 50]);

        const full = normalizePath('M0 50A50 50 0 1 1 50 0');
        expect(full.length).toBe(4); // 270°
    });

    it('rejects malformed data', () => {
        expect(() => normalizePath('10 10')).toThrow();
        expect(() => normalizePath('M0 0L10')).toThrow();
        expect(() => normalizePath('M0 0Z 5 5')).toThrow();
    });
});

describe('pathBounds', () => {
    it('finds the exact bounds of an arc', () => {
        expectBoundsClose(pathBounds(normalizePath('M0 50A50 50 0 0 1 100 50')), {
            x: 0,
            y: 0,
            width: 100,
            height: 50
        });
    });

    it('scales up an undersized arc radius', () => {
        expectBoundsClose(pathBounds(normalizePath('M0 50A10 10 0 0 1 100 50')), {
            x: 0,
            y: 0,
            width: 100,
            height: 50
        });
    });

    it('finds cubic extrema between the endpoints', () => {
        // Symmetric bump - peak at t=0.5 is y = 0.75 * -100.
        expectBoundsClose(pathBounds(normalizePath('M0 0C0 -100 100 -100 100 0')), {
            x: 0,
            y: -75,
            width: 100,
            height: 75
        });
    });

    it('applies a matrix before measuring', () => {
        const segs = normalizePath('M0 0H100V100H0Z'),
            b = pathBounds(segs, rotationMatrix(45));
        expect(b.width).toBeCloseTo(100 * Math.SQRT2, 9);
        expect(b.height).toBeCloseTo(100 * Math.SQRT2, 9);

        expectBoundsClose(pathBounds(segs, translate(10, -5)), {
            x: 10,
            y: -5,
            width: 100,
            height: 100
        });
    });

    it('returns empty bounds for no segments', () => {
        expect(pathBounds([])).toEqual({x: 0, y: 0, width: 0, height: 0});
    });

    it('matches golden values for real FA glyphs', () => {
        const gear = pathBounds(glyphSegs(glyphFromDefinition(faGear)));
        expect(gear.x).toBeCloseTo(-6.474, 2);
        expect(gear.y).toBeCloseTo(-16, 2);
        expect(gear.width).toBeCloseTo(525.104, 2);
        expect(gear.height).toBeCloseTo(544, 2);

        const circle = pathBounds(glyphSegs(glyphFromDefinition(faCircle)));
        expectBoundsClose(circle, {x: 0, y: 0, width: 512, height: 512}, 1e-9);
    });

    it('is finite, covers its endpoints and matches dense sampling for every far and fas glyph', () => {
        let count = 0;
        for (const def of uniqueDefs(far, fas)) {
            const segs = glyphSegs(glyphFromDefinition(def)),
                b = pathBounds(segs),
                ctx = `${def.prefix}:${def.iconName}`;

            expect([b.x, b.y, b.width, b.height].every(Number.isFinite), ctx).toBe(true);

            const ends = endpointBounds(segs);
            expect(
                b.x <= ends.x + EPS &&
                    b.y <= ends.y + EPS &&
                    b.x + b.width >= ends.x + ends.width - EPS &&
                    b.y + b.height >= ends.y + ends.height - EPS,
                ctx
            ).toBe(true);

            const dense = boundsOf(samplePath(segs, IDENTITY, 128));
            expect(maxBoundsDiff(b, dense), ctx).toBeLessThan(0.01);
            count++;
        }
        expect(count).toBeGreaterThan(1000);
    });
});

describe('samplePath', () => {
    it('emits M/L points plus perCurve points per cubic, transformed', () => {
        const segs = normalizePath('M0 0L10 0C10 5 15 10 20 10Z'),
            pts = samplePath(segs, translate(1, 2), 4);
        expect(pts.length).toBe((2 + 4) * 2);
        expect(Array.from(pts.slice(0, 4))).toEqual([1, 2, 11, 2]);
        expect(Array.from(pts.slice(-2))).toEqual([21, 12]);
    });
});

describe('matrices', () => {
    it('multiplies so that the right-hand matrix applies first', () => {
        const m = multiply(translate(10, 0), scale(2));
        expect(applyMatrix(m, 1, 1)).toEqual([12, 2]);
        const n = multiply(scale(2), translate(10, 0));
        expect(applyMatrix(n, 1, 1)).toEqual([22, 2]);
    });

    it('treats IDENTITY as a no-op', () => {
        const m: Matrix = [1, 2, 3, 4, 5, 6];
        expect(multiply(IDENTITY, m)).toEqual(m);
        expect(multiply(m, IDENTITY)).toEqual(m);
    });

    it('rotates clockwise on screen, with exact right angles', () => {
        expect(applyMatrix(rotationMatrix(90), 1, 0)).toEqual([0, 1]);
        expect(applyMatrix(rotationMatrix(180), 1, 0)).toEqual([-1, 0]);
        expect(rotationMatrix(360)).toEqual(rotationMatrix(0));
        expect(rotationMatrix(-90)).toEqual(rotationMatrix(270));
        const [x, y] = applyMatrix(rotationMatrix(45), 1, 0);
        expect(x).toBeCloseTo(Math.SQRT1_2, 12);
        expect(y).toBeCloseTo(Math.SQRT1_2, 12);
    });

    it('flips about the origin', () => {
        expect(applyMatrix(flipMatrix(true, false), 3, 4)).toEqual([-3, 4]);
        expect(applyMatrix(flipMatrix(false, true), 3, 4)).toEqual([3, -4]);
        expect(flipMatrix(false, false)).toEqual(IDENTITY);
    });
});

//------------------
// Helpers
//------------------
const EPS = 1e-6;

function expectSegClose(actual: Seg, expected: Seg) {
    expect(actual[0]).toBe(expected[0]);
    expect(actual.length).toBe(expected.length);
    for (let i = 1; i < expected.length; i++) {
        expect(actual[i] as number).toBeCloseTo(expected[i] as number, 9);
    }
}

function expectBoundsClose(actual: Bounds, expected: Bounds, tol = 1e-6) {
    expect(maxBoundsDiff(actual, expected)).toBeLessThan(tol);
}

function maxBoundsDiff(a: Bounds, b: Bounds): number {
    return Math.max(
        Math.abs(a.x - b.x),
        Math.abs(a.y - b.y),
        Math.abs(a.x + a.width - (b.x + b.width)),
        Math.abs(a.y + a.height - (b.y + b.height))
    );
}

function boundsOf(pts: Float64Array | number[]): Bounds {
    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
    for (let i = 0; i < pts.length; i += 2) {
        minX = Math.min(minX, pts[i]);
        maxX = Math.max(maxX, pts[i]);
        minY = Math.min(minY, pts[i + 1]);
        maxY = Math.max(maxY, pts[i + 1]);
    }
    return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
}

function endpointBounds(segs: Seg[]): Bounds {
    const pts: number[] = [];
    for (const s of segs) {
        if (s[0] === 'M' || s[0] === 'L') pts.push(s[1], s[2]);
        else if (s[0] === 'C') pts.push(s[5], s[6]);
    }
    return boundsOf(pts);
}

function uniqueDefs(...packs: IconPack[]): IconDefinition[] {
    const seen = new Set<string>(),
        ret: IconDefinition[] = [];
    for (const pack of packs) {
        for (const def of Object.values(pack)) {
            const key = `${def.prefix}:${def.iconName}`;
            if (seen.has(key)) continue;
            seen.add(key);
            ret.push(def);
        }
    }
    return ret;
}
