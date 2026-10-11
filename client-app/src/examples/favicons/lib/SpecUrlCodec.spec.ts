import {afterEach, describe, expect, it} from 'vitest';
import type {FaviconShape, FaviconSpec} from './FaviconSpec';
import {DEFAULT_SPEC, normalizeSpec, PREFIXES, SHAPES} from './FaviconSpec';
import {buildShareUrl, decodeSpec, encodeSpec, writeSpecToUrl} from './SpecUrlCodec';

describe('encodeSpec', () => {
    it('writes every key, in a readable form', () => {
        expect(encodeSpec(DEFAULT_SPEC)).toBe(
            'icon=rocket&w=fas&fg=263238&bg=f7931c&shape=rounded&r=20&pad=14&name=My+App'
        );
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
                appName: Array.from({length: int(0, 50)}, () => pick([...chars])).join('')
            };
            expect(decodeSpec(encodeSpec(s))).toEqual(normalizeSpec(s));
        }
    });

    it('gives the default for an empty query', () => {
        expect(decodeSpec('')).toEqual(DEFAULT_SPEC);
        expect(decodeSpec('?')).toEqual(DEFAULT_SPEC);
        expect(decodeSpec(undefined)).toEqual(DEFAULT_SPEC);
    });

    it('accepts a leading ?', () => {
        expect(decodeSpec('?icon=leaf').iconName).toBe('leaf');
    });

    it('fills missing keys with defaults', () => {
        expect(decodeSpec('icon=leaf&shape=circle')).toEqual({
            ...DEFAULT_SPEC,
            iconName: 'leaf',
            shape: 'circle'
        });
    });

    it('normalizes hex3 and uppercase colors', () => {
        const spec = decodeSpec('fg=FFF&bg=0B4F6C');
        expect(spec.fgColor).toBe('#ffffff');
        expect(spec.bgColor).toBe('#0b4f6c');
    });

    it('clamps out-of-range numbers', () => {
        const spec = decodeSpec('pad=99&r=-3');
        expect(spec.padding).toBe(40);
        expect(spec.radius).toBe(0);
    });

    it('truncates long app names', () => {
        expect(decodeSpec('name=' + 'n'.repeat(60)).appName).toBe('n'.repeat(40));
        expect(decodeSpec('name=').appName).toBe('');
    });

    it('falls back to defaults for invalid values, keeping valid ones', () => {
        expect(decodeSpec('w=fab&fg=red&bg=12&shape=hexagon&pad=x&icon=leaf')).toEqual({
            ...DEFAULT_SPEC,
            iconName: 'leaf'
        });
    });

    it('ignores unknown params', () => {
        expect(decodeSpec('xhCacheBuster=12345&icon=leaf&foo=bar')).toEqual({
            ...DEFAULT_SPEC,
            iconName: 'leaf'
        });
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
        expect(decodeSpec(window.location.search)).toEqual(spec);
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
