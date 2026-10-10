import {describe, expect, it} from 'vitest';
import {designChecks, fmtRatio} from './Checks';
import {DEFAULT_SPEC, normalizeSpec} from './FaviconSpec';
import type {FaviconSpec} from './FaviconSpec';

function checksFor(s: Partial<FaviconSpec>) {
    return designChecks(normalizeSpec({...DEFAULT_SPEC, ...s}));
}

function failed(s: Partial<FaviconSpec>) {
    return checksFor(s).filter(it => it.warning);
}

describe('designChecks', () => {
    it('passes the default design', () => {
        const checks = checksFor({});
        expect(checks.map(it => it.label)).toEqual([
            'Glyph on backdrop contrast',
            'Stroke weight at 16px'
        ]);
        expect(checks.every(it => it.warning === null && it.advice === null)).toBe(true);
    });

    it('checks glyph against backdrop with a shape, flagged on the hero', () => {
        const [check] = failed({fgColor: '#f5a04c', bgColor: '#f7931c'});
        expect(check.label).toBe('Glyph on backdrop contrast');
        expect(check.value).toBe('1.1:1');
        expect(check.warning).toBe('Low glyph contrast (1.1:1)');
        expect(check.advice).toBeTruthy();
        expect(check.preview).toBe('hero');
    });

    it('checks glyph against light and dark tabs with no backdrop, flagged on the tabs', () => {
        const checks = checksFor({shape: 'none', fgColor: '#263238'});
        expect(checks.map(it => it.label)).toEqual([
            'Contrast on light tabs',
            'Contrast on dark tabs',
            'Stroke weight at 16px'
        ]);

        const fails = checks.filter(it => it.warning);
        expect(fails).toHaveLength(1);
        expect(fails[0].warning).toBe('Low contrast on dark tabs (1.1:1)');
        expect(fails[0].preview).toBe('tabs');
    });

    it('flags a white glyph with no backdrop on light tabs', () => {
        const [check] = failed({shape: 'none', fgColor: '#ffffff'});
        expect(check.label).toBe('Contrast on light tabs');
        expect(check.preview).toBe('tabs');
    });

    it('ignores the backdrop color with no backdrop', () => {
        expect(failed({shape: 'none', fgColor: '#1e88e5', bgColor: '#1e88e5'})).toEqual([]);
    });

    it('passes just above the 3:1 threshold and fails just below it', () => {
        // #949494 on white is ~3.03:1, #959595 is ~2.99:1.
        expect(failed({fgColor: '#949494', bgColor: '#ffffff'})).toEqual([]);
        expect(failed({fgColor: '#959595', bgColor: '#ffffff'})).toHaveLength(1);
    });

    it('flags Light and Thin weights on the size strip, naming the weight', () => {
        for (const [prefix, name] of [
            ['fal', 'Light'],
            ['fat', 'Thin']
        ] as const) {
            const [check] = failed({prefix});
            expect(check.value).toBe(name);
            expect(check.warning).toBe(`${name} strokes can vanish at 16px`);
            expect(check.preview).toBe('sizes');
        }
    });

    it('passes Solid and Regular weights', () => {
        expect(failed({prefix: 'fas'})).toEqual([]);
        expect(failed({prefix: 'far'})).toEqual([]);
    });
});

describe('fmtRatio', () => {
    it('formats to one decimal place', () => {
        expect(fmtRatio(21)).toBe('21.0:1');
        expect(fmtRatio(4.567)).toBe('4.6:1');
    });
});
