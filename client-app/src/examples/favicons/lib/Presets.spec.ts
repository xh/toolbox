import type {IconDefinition, IconPack} from '@fortawesome/fontawesome-svg-core';
import {fal} from '@fortawesome/pro-light-svg-icons';
import {far} from '@fortawesome/pro-regular-svg-icons';
import {fas} from '@fortawesome/pro-solid-svg-icons';
import {fat} from '@fortawesome/pro-thin-svg-icons';
import type {HoistIconPrefix} from '@xh/hoist/icon';
import {describe, expect, it} from 'vitest';
import {contrastRatio} from './Colors';
import {DEFAULT_PADDING, DEFAULT_RADIUS, DEFAULT_SPEC, normalizeSpec} from './FaviconSpec';
import {FAVICON_PRESETS, randomSpec} from './Presets';

const PACKS: Partial<Record<HoistIconPrefix, IconPack>> = {fas, far, fal, fat};

function canonicalNames(pack: IconPack): Set<string> {
    return new Set(Object.values(pack).map((def: IconDefinition) => def.iconName));
}

describe('FAVICON_PRESETS', () => {
    it('has six uniquely named presets', () => {
        expect(FAVICON_PRESETS).toHaveLength(6);
        expect(new Set(FAVICON_PRESETS.map(p => p.name)).size).toBe(6);
    });

    it('starts with the default design', () => {
        const {name, ...rest} = FAVICON_PRESETS[0];
        expect(name).toBe('Hoist Classic');
        expect({...rest, appName: DEFAULT_SPEC.appName}).toEqual(DEFAULT_SPEC);
    });

    it('are all already-normalized specs', () => {
        for (const {name, ...rest} of FAVICON_PRESETS) {
            const spec = {...rest, appName: 'x'};
            expect(normalizeSpec(spec), name).toEqual(spec);
            expect(spec.rotation, name).toBe(0);
            expect(spec.flipH || spec.flipV, name).toBe(false);
        }
    });

    it("each uses a canonical glyph name that exists in its prefix's pack", () => {
        for (const p of FAVICON_PRESETS) {
            const pack = PACKS[p.prefix];
            expect(pack, p.name).toBeDefined();
            expect(canonicalNames(pack).has(p.iconName), `${p.name}: ${p.iconName}`).toBe(true);
        }
    });
});

describe('randomSpec', () => {
    const names = ['rocket', 'bolt', 'leaf', 'gear', 'house', 'star'];
    const current = {...DEFAULT_SPEC, appName: 'Keep Me', rotation: 90, flipH: true};

    it('is deterministic for a seeded rng', () => {
        const a = Array.from({length: 20}, (_, i) => randomSpec(mulberry32(i), names, current)),
            b = Array.from({length: 20}, (_, i) => randomSpec(mulberry32(i), names, current));
        expect(a).toEqual(b);
    });

    it('yields valid, readable specs', () => {
        const rng = mulberry32(42),
            shapes = new Set<string>(),
            prefixes = new Set<string>();

        for (let i = 0; i < 300; i++) {
            const s = randomSpec(rng, names, current);
            expect(normalizeSpec(s)).toEqual(s);

            shapes.add(s.shape);
            prefixes.add(s.prefix);

            expect(s.appName).toBe('Keep Me');
            expect(s.rotation).toBe(0);
            expect(s.flipH).toBe(false);
            expect(s.flipV).toBe(false);
            expect(s.radius).toBe(DEFAULT_RADIUS);
            expect(s.padding).toBe(DEFAULT_PADDING[s.shape]);

            expect(names).toContain(s.iconName);

            // The glyph is always legible against whatever it sits on (backdrop or, for the
            // apple icon with shape 'none', the bg color).
            expect(contrastRatio(s.fgColor, s.bgColor)).toBeGreaterThanOrEqual(3);
        }

        expect([...shapes].sort()).toEqual(['circle', 'none', 'rounded', 'square']);
        expect([...prefixes].sort()).toEqual(['fal', 'far', 'fas', 'fat']);
    });

    it('keeps the current glyph when there are no names', () => {
        const s = randomSpec(mulberry32(1), [], current);
        expect(s.iconName).toBe(current.iconName);
        expect(s.prefix).toBe(current.prefix);
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
