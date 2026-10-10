import {afterEach, describe, expect, it} from 'vitest';
import type {FaviconShape, FaviconSpec} from './FaviconSpec';
import {DEFAULT_SPEC, normalizeSpec, PREFIXES, SHAPES} from './FaviconSpec';
import {buildShareUrl, decodeSpec, encodeSpec, writeSpecToUrl} from './SpecUrlCodec';

describe('encodeSpec', () => {
    it('writes every key, in a readable form', () => {
        expect(encodeSpec(DEFAULT_SPEC)).toBe(
            'icon=rocket&w=fas&fg=263238&bg=f7931c&shape=rounded&r=20&pad=14&rot=0&flip=none&name=My+App'
        );
    });

    it('encodes flips', () => {
        const flip = (flipH: boolean, flipV: boolean) =>
            new URLSearchParams(encodeSpec({...DEFAULT_SPEC, flipH, flipV})).get('flip');
        expect(flip(false, false)).toBe('none');
        expect(flip(true, false)).toBe('h');
        expect(flip(false, true)).toBe('v');
        expect(flip(true, true)).toBe('hv');
    });
});

describe('decodeSpec', () => {
    it('round-trips seeded random specs', () => {
        const rng = mulberry32(7),
            pick = <T>(arr: readonly T[]) => arr[Math.floor(rng() * arr.length)],
            int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1)),
            hex = () =>
                '#' +
                Math.floor(rng() * 0x1000000)
                    .toString(16)
                    .padStart(6, '0'),
            chars = 'abcXYZ 019&=?#%+/é-_';

        for (let i = 0; i < 200; i++) {
            const s: FaviconSpec = {
                iconName: pick(['rocket', 'chart-line', 'github', 'a', '0-9', 'x'.repeat(64)]),
                prefix: pick(PREFIXES),
                fgColor: rng() < 0.5 ? hex() : hex().toUpperCase(),
                bgColor: hex(),
                shape: pick(SHAPES) as FaviconShape,
                radius: int(-10, 70),
                padding: int(-10, 60),
                rotation: int(-720, 720),
                flipH: rng() < 0.5,
                flipV: rng() < 0.5,
                appName: Array.from({length: int(0, 50)}, () => pick([...chars])).join('')
            };
            const {spec, warnings} = decodeSpec(encodeSpec(s));
            expect(spec).toEqual(normalizeSpec(s));
            expect(warnings).toEqual([]);
        }
    });

    it('gives the default for an empty query, with no warnings', () => {
        expect(decodeSpec('')).toEqual({spec: DEFAULT_SPEC, warnings: []});
        expect(decodeSpec('?')).toEqual({spec: DEFAULT_SPEC, warnings: []});
        expect(decodeSpec(undefined)).toEqual({spec: DEFAULT_SPEC, warnings: []});
    });

    it('accepts a leading ?', () => {
        expect(decodeSpec('?icon=leaf').spec.iconName).toBe('leaf');
    });

    it('fills missing keys silently', () => {
        const {spec, warnings} = decodeSpec('icon=leaf&shape=circle');
        expect(warnings).toEqual([]);
        expect(spec).toEqual({...DEFAULT_SPEC, iconName: 'leaf', shape: 'circle'});
    });

    it('normalizes hex3 and uppercase colors', () => {
        const {spec, warnings} = decodeSpec('fg=FFF&bg=0B4F6C');
        expect(warnings).toEqual([]);
        expect(spec.fgColor).toBe('#ffffff');
        expect(spec.bgColor).toBe('#0b4f6c');
    });

    it('clamps out-of-range numbers and wraps rotation', () => {
        const {spec, warnings} = decodeSpec('pad=99&r=-3&rot=-90');
        expect(warnings).toEqual([]);
        expect(spec.padding).toBe(40);
        expect(spec.radius).toBe(0);
        expect(spec.rotation).toBe(270);
        expect(decodeSpec('rot=720').spec.rotation).toBe(0);
    });

    it('truncates long app names', () => {
        expect(decodeSpec('name=' + 'n'.repeat(60)).spec.appName).toBe('n'.repeat(40));
        expect(decodeSpec('name=').spec.appName).toBe('');
    });

    it('falls back to defaults with a warning per invalid value', () => {
        const {spec, warnings} = decodeSpec(
            'icon=Bad_Name&w=fax&fg=red&bg=12&shape=hexagon&r=1.5&pad=x&rot=&flip=sideways'
        );
        expect(spec).toEqual(DEFAULT_SPEC);
        expect(warnings).toHaveLength(9);
        for (const key of ['icon', 'w', 'fg', 'bg', 'shape', 'r', 'pad', 'rot', 'flip']) {
            expect(
                warnings.some(w => w.includes(`'${key}'`)),
                key
            ).toBe(true);
        }
    });

    it('keeps valid values alongside invalid ones', () => {
        const {spec, warnings} = decodeSpec('icon=leaf&fg=zzz&flip=hv');
        expect(warnings).toHaveLength(1);
        expect(spec).toEqual({...DEFAULT_SPEC, iconName: 'leaf', flipH: true, flipV: true});
    });

    it('ignores unknown params', () => {
        const {spec, warnings} = decodeSpec('xhCacheBuster=12345&icon=leaf&foo=bar');
        expect(warnings).toEqual([]);
        expect(spec).toEqual({...DEFAULT_SPEC, iconName: 'leaf'});
    });

    it('rejects icon names over 64 chars', () => {
        expect(decodeSpec('icon=' + 'x'.repeat(65)).warnings).toHaveLength(1);
    });
});

describe('buildShareUrl', () => {
    it('combines origin, path and the encoded spec', () => {
        const url = buildShareUrl(DEFAULT_SPEC, {
            origin: 'https://toolbox.xh.io',
            pathname: '/favicons/'
        });
        expect(url).toBe(`https://toolbox.xh.io/favicons/?${encodeSpec(DEFAULT_SPEC)}`);
    });

    it('defaults to the current location', () => {
        expect(buildShareUrl(DEFAULT_SPEC)).toBe(
            `${window.location.origin}${window.location.pathname}?${encodeSpec(DEFAULT_SPEC)}`
        );
    });
});

describe('writeSpecToUrl', () => {
    const initialUrl = window.location.href;
    afterEach(() => window.history.replaceState(null, '', initialUrl));

    it('replaces the query, keeping path, hash and history state', () => {
        window.history.replaceState({keep: 1}, '', '/favicons/?old=1#frag');
        const len = window.history.length;

        const spec = {...DEFAULT_SPEC, iconName: 'leaf'};
        writeSpecToUrl(spec);

        expect(window.location.pathname).toBe('/favicons/');
        expect(window.location.search).toBe('?' + encodeSpec(spec));
        expect(window.location.hash).toBe('#frag');
        expect(window.history.state).toEqual({keep: 1});
        expect(window.history.length).toBe(len);
        expect(decodeSpec(window.location.search).spec).toEqual(spec);
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
