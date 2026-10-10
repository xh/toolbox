import {strToU8, unzipSync} from 'fflate';
import {describe, expect, it, vi} from 'vitest';
import {
    buildFaviconZip,
    FAVICON_FILE_NAMES,
    renderFaviconFilesAsync,
    zipFileName
} from './FaviconExport';
import type {Glyph} from './FaviconSpec';
import {DEFAULT_SPEC} from './FaviconSpec';
import {buildFaviconSvg} from './SvgBuilder';

const GLYPH: Glyph = {
    prefix: 'fas',
    iconName: 'test-square',
    width: 512,
    height: 512,
    paths: ['M64 64H448V448H64Z']
};

const SPEC = {...DEFAULT_SPEC, shape: 'circle' as const};

// Compare as plain arrays - jsdom and Node each have their own Uint8Array, which deep-equal rejects.
const bytes = (u: Uint8Array) => Array.from(u);

/** Fake rasterizer - each "PNG" is just its size as text. */
const fakeRasterize = (svg: string, size: number) => Promise.resolve(new Blob([String(size)]));

describe('renderFaviconFilesAsync', () => {
    it('rasterizes the main SVG at 192 and 512 and the apple variant at 180', async () => {
        const rasterize = vi.fn(fakeRasterize);
        await renderFaviconFilesAsync(GLYPH, SPEC, {rasterize});

        expect(rasterize.mock.calls).toEqual([
            [buildFaviconSvg(GLYPH, SPEC, {size: 192}), 192],
            [buildFaviconSvg(GLYPH, SPEC, {size: 512}), 512],
            [buildFaviconSvg(GLYPH, SPEC, {size: 180, variant: 'apple'}), 180]
        ]);
    });

    it('returns the main SVG with its comment and the PNG bytes', async () => {
        const comment =
                'Made with the Hoist Favicon Generator: https://example.com/favicons/?icon=rocket',
            files = await renderFaviconFilesAsync(GLYPH, SPEC, {
                rasterize: fakeRasterize,
                comment
            });

        expect(files.svg).toBe(buildFaviconSvg(GLYPH, SPEC, {comment}));
        expect(files.svg).toContain('https://example.com/favicons/?icon=rocket');
        expect(bytes(files.png192)).toEqual(bytes(strToU8('192')));
        expect(bytes(files.png512)).toEqual(bytes(strToU8('512')));
        expect(bytes(files.apple180)).toEqual(bytes(strToU8('180')));
    });
});

describe('buildFaviconZip', () => {
    it('contains exactly the four files, byte for byte', async () => {
        const files = await renderFaviconFilesAsync(GLYPH, SPEC, {rasterize: fakeRasterize}),
            entries = unzipSync(buildFaviconZip(files));

        expect(Object.keys(entries).sort()).toEqual([...FAVICON_FILE_NAMES].sort());
        expect(bytes(entries['favicon.svg'])).toEqual(bytes(strToU8(files.svg)));
        expect(bytes(entries['favicon-192.png'])).toEqual(bytes(files.png192));
        expect(bytes(entries['favicon-512.png'])).toEqual(bytes(files.png512));
        expect(bytes(entries['apple-touch-icon.png'])).toEqual(bytes(files.apple180));
    });

    it('is deterministic for a fixed mtime', async () => {
        const files = await renderFaviconFilesAsync(GLYPH, SPEC, {rasterize: fakeRasterize}),
            mtime = new Date(2026, 0, 2, 3, 4, 6);
        expect(bytes(buildFaviconZip(files, mtime))).toEqual(bytes(buildFaviconZip(files, mtime)));
    });
});

describe('zipFileName', () => {
    it('slugs the app name', () => {
        expect(zipFileName('My App!')).toBe('my-app-favicons.zip');
        expect(zipFileName('  Trading Desk 2 ')).toBe('trading-desk-2-favicons.zip');
        expect(zipFileName('fooBar')).toBe('foo-bar-favicons.zip');
        expect(zipFileName('Café Ops')).toBe('cafe-ops-favicons.zip');
    });

    it('falls back to hoist-app', () => {
        expect(zipFileName('')).toBe('hoist-app-favicons.zip');
        expect(zipFileName('!!!')).toBe('hoist-app-favicons.zip');
        expect(zipFileName('日本')).toBe('hoist-app-favicons.zip');
        expect(zipFileName(null)).toBe('hoist-app-favicons.zip');
    });
});
