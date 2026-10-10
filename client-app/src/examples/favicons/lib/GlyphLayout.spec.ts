import {faCircle, faGear} from '@fortawesome/pro-regular-svg-icons';
import {describe, expect, it} from 'vitest';
import type {FaviconShape, Glyph} from './FaviconSpec';
import {DEFAULT_SPEC, glyphFromDefinition} from './FaviconSpec';
import type {LayoutSpec} from './GlyphLayout';
import {appleLayoutSpec, layoutGlyph, TILE} from './GlyphLayout';
import {glyphSegs, pathBounds, samplePath} from './PathGeometry';

const gear = glyphFromDefinition(faGear),
    circle = glyphFromDefinition(faCircle),
    square512 = synthGlyph('square512', 512, 512, 'M0 0H512V512H0Z'),
    wide640 = synthGlyph('wide640', 640, 512, 'M0 0H640V512H0Z');

describe('layoutGlyph', () => {
    it('maps a full 512 square glyph onto the tile with shape none and no padding', () => {
        const {matrix, scale} = layoutGlyph(square512, spec('none', {padding: 0}));
        expect(scale).toBe(1);
        expectClose(matrix, [1, 0, 0, 1, 0, 0]);
    });

    it('centres a wide glyph, spanning the tile horizontally', () => {
        const b = laidOutBounds(wide640, spec('none', {padding: 0}));
        expect(b.x).toBeCloseTo(0, 9);
        expect(b.width).toBeCloseTo(512, 9);
        expect(b.height).toBeCloseTo(409.6, 9);
        expect(b.y + b.height / 2).toBeCloseTo(256, 9);
    });

    it('applies padding as an inset from the tile edge', () => {
        const b = laidOutBounds(square512, spec('square', {padding: 10}));
        expect(b.x).toBeCloseTo(51.2, 9);
        expect(b.width).toBeCloseTo(512 - 102.4, 9);
    });

    it('keeps the gear, which overflows its viewBox, inside the tile for every shape', () => {
        for (const shape of SHAPES) {
            const b = laidOutBounds(gear, spec(shape, {padding: 0}));
            expect(b.x, shape).toBeGreaterThanOrEqual(-1e-6);
            expect(b.y, shape).toBeGreaterThanOrEqual(-1e-6);
            expect(b.x + b.width, shape).toBeLessThanOrEqual(TILE + 1e-6);
            expect(b.y + b.height, shape).toBeLessThanOrEqual(TILE + 1e-6);
            expect(b.x + b.width / 2, shape).toBeCloseTo(256, 6);
            expect(b.y + b.height / 2, shape).toBeCloseTo(256, 6);
        }
    });

    it('fits the actual path, not its bounding box, within a circle', () => {
        const s = spec('circle', {padding: 10}),
            radius = TILE / 2 - 0.1 * TILE,
            {matrix} = layoutGlyph(gear, s),
            pts = samplePath(glyphSegs(gear), matrix, 64);
        let maxDist = 0;
        for (let i = 0; i < pts.length; i += 2) {
            maxDist = Math.max(maxDist, Math.hypot(pts[i] - 256, pts[i + 1] - 256));
        }
        expect(maxDist).toBeLessThanOrEqual(radius);
        expect(maxDist).toBeGreaterThan(radius * 0.99);

        // A circle glyph fills the circle - k = R / 256, less the small safety margin.
        const {scale} = layoutGlyph(circle, s);
        expect(scale).toBeLessThanOrEqual(radius / 256);
        expect(scale).toBeGreaterThan((radius / 256) * 0.996);
    });

    it('fits rounded between square and circle, matching each at the extremes', () => {
        const kSquare = layoutGlyph(gear, spec('square', {padding: 8})).scale,
            kCircle = layoutGlyph(gear, spec('circle', {padding: 8})).scale,
            k = (radius: number) => layoutGlyph(gear, spec('rounded', {padding: 8, radius})).scale;

        expect(kCircle).toBeLessThan(kSquare);

        // r' = max(0, radius - pad) = 0 is a plain square.
        expect(k(0)).toBeCloseTo(kSquare, 9);
        expect(k(8)).toBeCloseTo(kSquare, 9);

        // Full radius is a circle - the bisection lands on the exact sample fit, without the safety margin.
        expect(k(50) / kCircle).toBeGreaterThanOrEqual(1);
        expect(k(50) / kCircle).toBeLessThan(1.003);

        for (const radius of [15, 20, 30, 40]) {
            expect(k(radius)).toBeGreaterThanOrEqual(kCircle);
            expect(k(radius)).toBeLessThanOrEqual(kSquare);
        }
        expect(k(20)).toBeGreaterThanOrEqual(k(40));
    });

    it('swaps dimensions when rotated 90 degrees', () => {
        const a = laidOutBounds(wide640, spec('none', {padding: 0})),
            b = laidOutBounds(wide640, spec('none', {padding: 0, rotation: 90}));
        expect(b.width).toBeCloseTo(a.height, 9);
        expect(b.height).toBeCloseTo(a.width, 9);
    });

    it('treats rotations of 0 and 360 identically', () => {
        expect(layoutGlyph(gear, spec('rounded', {rotation: 360}))).toEqual(
            layoutGlyph(gear, spec('rounded', {rotation: 0}))
        );
    });

    it('mirrors with flipH, keeping the laid-out bounds', () => {
        const plain = layoutGlyph(gear, spec('square')),
            flipped = layoutGlyph(gear, spec('square', {flipH: true}));
        expect(flipped.matrix[0]).toBeLessThan(0);
        expect(flipped.scale).toBeCloseTo(plain.scale, 9);

        const pb = laidOutBounds(gear, spec('square')),
            fb = laidOutBounds(gear, spec('square', {flipH: true}));
        expectClose([fb.x, fb.y, fb.width, fb.height], [pb.x, pb.y, pb.width, pb.height]);
    });
});

describe('appleLayoutSpec', () => {
    it('uses a rounded fit with padding of at least 10', () => {
        const low = appleLayoutSpec({...DEFAULT_SPEC, shape: 'none', padding: 6});
        expect(low.shape).toBe('rounded');
        expect(low.radius).toBe(22);
        expect(low.padding).toBe(10);

        expect(appleLayoutSpec({...DEFAULT_SPEC, padding: 30}).padding).toBe(30);
    });

    it('keeps the remaining fields', () => {
        const s = {...DEFAULT_SPEC, fgColor: '#123456', rotation: 45, flipV: true},
            ret = appleLayoutSpec(s);
        expect(ret.fgColor).toBe('#123456');
        expect(ret.rotation).toBe(45);
        expect(ret.flipV).toBe(true);
    });
});

//------------------
// Helpers
//------------------
const SHAPES: FaviconShape[] = ['none', 'square', 'rounded', 'circle'];

function spec(shape: FaviconShape, overrides: Partial<LayoutSpec> = {}): LayoutSpec {
    return {shape, radius: 20, padding: 0, rotation: 0, flipH: false, flipV: false, ...overrides};
}

function synthGlyph(iconName: string, width: number, height: number, d: string): Glyph {
    return {prefix: 'fas', iconName: `test-layout-${iconName}`, width, height, paths: [d]};
}

function laidOutBounds(glyph: Glyph, s: LayoutSpec) {
    return pathBounds(glyphSegs(glyph), layoutGlyph(glyph, s).matrix);
}

function expectClose(actual: number[], expected: number[]) {
    expect(actual.length).toBe(expected.length);
    actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 9));
}
