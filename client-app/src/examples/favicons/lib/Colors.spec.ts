import {describe, expect, it} from 'vitest';
import {contrastRatio, DARK_FG, hslToHex, LIGHT_FG, readableFgFor} from './Colors';

describe('contrastRatio', () => {
    it('is 21 for black on white, in either order', () => {
        expect(contrastRatio('#000', '#fff')).toBe(21);
        expect(contrastRatio('#ffffff', '#000000')).toBe(21);
    });

    it('is 1 for identical colors', () => {
        expect(contrastRatio('#f7931c', '#F7931C')).toBe(1);
    });

    it('matches known WCAG values', () => {
        // #767676 on white is the classic 4.54:1 AA threshold gray.
        expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
        expect(contrastRatio('#1976d2', '#ffffff')).toBeCloseTo(4.6, 1);
    });
});

describe('readableFgFor', () => {
    it('picks white on dark and near-black on light backgrounds', () => {
        expect(readableFgFor('#000000')).toBe(LIGHT_FG);
        expect(readableFgFor('#01579b')).toBe(LIGHT_FG);
        expect(readableFgFor('#ffffff')).toBe(DARK_FG);
        expect(readableFgFor('#f7931c')).toBe(DARK_FG);
    });

    it('gives at least 3:1 over 500 seeded random backgrounds', () => {
        const rng = mulberry32(12345);
        for (let i = 0; i < 500; i++) {
            const bg =
                '#' +
                Math.floor(rng() * 0x1000000)
                    .toString(16)
                    .padStart(6, '0');
            expect(contrastRatio(readableFgFor(bg), bg)).toBeGreaterThanOrEqual(3);
        }
    });
});

describe('hslToHex', () => {
    it('converts primaries and grays', () => {
        expect(hslToHex(0, 100, 50)).toBe('#ff0000');
        expect(hslToHex(120, 100, 50)).toBe('#00ff00');
        expect(hslToHex(240, 100, 50)).toBe('#0000ff');
        expect(hslToHex(0, 0, 0)).toBe('#000000');
        expect(hslToHex(0, 0, 100)).toBe('#ffffff');
        expect(hslToHex(123, 0, 50)).toBe('#808080');
    });

    it('converts an arbitrary color', () => {
        // Material blue 700 is hsl(210, 79%, 46%).
        expect(hslToHex(210, 79, 46)).toBe('#1975d2');
    });

    it('wraps hue and clamps saturation and lightness', () => {
        expect(hslToHex(360, 100, 50)).toBe('#ff0000');
        expect(hslToHex(-120, 100, 50)).toBe('#0000ff');
        expect(hslToHex(0, 150, 50)).toBe('#ff0000');
        expect(hslToHex(0, 100, 120)).toBe('#ffffff');
    });
});

function mulberry32(seed: number): () => number {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
