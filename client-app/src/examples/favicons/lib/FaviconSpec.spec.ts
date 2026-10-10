import type {IconDefinition} from '@fortawesome/fontawesome-svg-core';
import {describe, expect, it} from 'vitest';
import {
    DEFAULT_PADDING,
    DEFAULT_SPEC,
    glyphFromDefinition,
    normalizeHex,
    normalizeSpec,
    PREFIXES
} from './FaviconSpec';

describe('normalizeHex', () => {
    it('accepts six-digit hex with or without #, lowercasing', () => {
        expect(normalizeHex('#0B4F6C')).toBe('#0b4f6c');
        expect(normalizeHex('0b4f6c')).toBe('#0b4f6c');
    });

    it('expands three-digit hex', () => {
        expect(normalizeHex('#FFF')).toBe('#ffffff');
        expect(normalizeHex('a1c')).toBe('#aa11cc');
    });

    it('trims surrounding whitespace', () => {
        expect(normalizeHex('  #abc ')).toBe('#aabbcc');
    });

    it('rejects anything else', () => {
        for (const bad of [
            '',
            '#',
            '#ab',
            '#abcd',
            '#abcde',
            '#abcdefa',
            'ggg',
            '#12345g',
            'red'
        ]) {
            expect(normalizeHex(bad)).toBeNull();
        }
        expect(normalizeHex(null)).toBeNull();
        expect(normalizeHex(undefined)).toBeNull();
        expect(normalizeHex(123 as any)).toBeNull();
    });
});

describe('normalizeSpec', () => {
    it('fills an empty spec with the defaults', () => {
        expect(normalizeSpec({})).toEqual(DEFAULT_SPEC);
        expect(normalizeSpec(undefined)).toEqual(DEFAULT_SPEC);
    });

    it('default matches Hoist Classic plus appName', () => {
        expect(DEFAULT_SPEC).toEqual({
            iconName: 'rocket',
            prefix: 'fas',
            fgColor: '#263238',
            bgColor: '#f7931c',
            shape: 'rounded',
            radius: 20,
            padding: DEFAULT_PADDING.rounded,
            rotation: 0,
            flipH: false,
            flipV: false,
            appName: 'My App'
        });
    });

    it('keeps valid values', () => {
        const spec = {
            iconName: 'leaf',
            prefix: 'fat' as const,
            fgColor: '#ffffff',
            bgColor: '#01579b',
            shape: 'circle' as const,
            radius: 33,
            padding: 0,
            rotation: 359,
            flipH: true,
            flipV: true,
            appName: ''
        };
        expect(normalizeSpec(spec)).toEqual(spec);
    });

    it('clamps and rounds numbers', () => {
        expect(normalizeSpec({radius: 99, padding: 99})).toMatchObject({radius: 50, padding: 40});
        expect(normalizeSpec({radius: -5, padding: -1})).toMatchObject({radius: 0, padding: 0});
        expect(normalizeSpec({radius: 12.6, padding: 7.4})).toMatchObject({radius: 13, padding: 7});
    });

    it('takes rotation mod 360', () => {
        expect(normalizeSpec({rotation: 360}).rotation).toBe(0);
        expect(normalizeSpec({rotation: 450}).rotation).toBe(90);
        expect(normalizeSpec({rotation: -90}).rotation).toBe(270);
        expect(normalizeSpec({rotation: -360}).rotation).toBe(0);
        expect(Object.is(normalizeSpec({rotation: -360}).rotation, 0)).toBe(true);
        expect(normalizeSpec({rotation: 44.6}).rotation).toBe(45);
    });

    it('falls back to defaults for invalid values', () => {
        const spec = normalizeSpec({
            iconName: '  ',
            prefix: 'fax' as any,
            fgColor: 'nope',
            bgColor: '#12',
            shape: 'hexagon' as any,
            radius: NaN,
            padding: Infinity,
            rotation: 'x' as any,
            flipH: 'yes' as any,
            flipV: null,
            appName: 42 as any
        });
        expect(spec).toEqual(DEFAULT_SPEC);
    });

    it('accepts only the Pro weights', () => {
        expect(PREFIXES).toEqual(['fas', 'far', 'fal', 'fat']);
        expect(normalizeSpec({prefix: 'fab'}).prefix).toBe(DEFAULT_SPEC.prefix);
    });

    it('normalizes colors to lowercase six-digit hex', () => {
        expect(normalizeSpec({fgColor: 'FFF', bgColor: '#0B4F6C'})).toMatchObject({
            fgColor: '#ffffff',
            bgColor: '#0b4f6c'
        });
    });

    it('truncates appName to 40 chars', () => {
        expect(normalizeSpec({appName: 'x'.repeat(50)}).appName).toBe('x'.repeat(40));
    });
});

describe('glyphFromDefinition', () => {
    it('handles a single path string', () => {
        const def = {
            prefix: 'fas',
            iconName: 'rocket',
            icon: [512, 448, [], 'f135', 'M0 0L10 10Z']
        } as IconDefinition;
        expect(glyphFromDefinition(def)).toEqual({
            prefix: 'fas',
            iconName: 'rocket',
            width: 512,
            height: 448,
            paths: ['M0 0L10 10Z']
        });
    });

    it('handles a path array, dropping empty entries', () => {
        const def = {
            prefix: 'far',
            iconName: 'gear',
            icon: [640, 512, [], 'f013', ['', 'M1 1Z', 'M2 2Z']]
        } as unknown as IconDefinition;
        expect(glyphFromDefinition(def).paths).toEqual(['M1 1Z', 'M2 2Z']);
    });
});
