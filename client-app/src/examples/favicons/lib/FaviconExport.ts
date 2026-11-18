import {strToU8, zipSync} from 'fflate';
import {kebabCase} from 'lodash';
import type {FaviconSpec, Glyph} from './FaviconSpec';
import {buildFaviconSvg} from './SvgBuilder';

/** The files in a downloaded favicon set, in zip order. */
export const FAVICON_FILE_NAMES = [
    'favicon.svg',
    'favicon-192.png',
    'favicon-512.png',
    'apple-touch-icon.png'
] as const;

/** The rendered contents of a favicon set. */
export interface FaviconFiles {
    svg: string;
    png192: Uint8Array;
    png512: Uint8Array;
    apple180: Uint8Array;
}

/**
 * Render a complete favicon set - the main SVG plus 192 and 512 PNGs, and the 180px apple touch
 * icon (full-bleed square variant).
 *
 * @param opts.rasterize - renders an SVG string to a PNG blob at the given size. Each SVG passed is
 *      built with its `size` equal to the target size.
 * @param opts.comment - optional comment embedded in `favicon.svg`, e.g. the design's share URL.
 */
export async function renderFaviconFilesAsync(
    glyph: Glyph,
    spec: FaviconSpec,
    opts: {rasterize: (svg: string, size: number) => Promise<Blob>; comment?: string}
): Promise<FaviconFiles> {
    const {rasterize, comment} = opts,
        svg = buildFaviconSvg(glyph, spec, {comment}),
        [png192, png512, apple180] = await Promise.all([
            rasterize(buildFaviconSvg(glyph, spec, {size: 192}), 192),
            rasterize(buildFaviconSvg(glyph, spec, {size: 512}), 512),
            rasterize(buildFaviconSvg(glyph, spec, {size: 180, variant: 'apple'}), 180)
        ]).then(blobs => Promise.all(blobs.map(blobToBytesAsync)));

    return {svg, png192, png512, apple180};
}

/**
 * Package a favicon set as a flat zip. PNGs are stored uncompressed (already deflated).
 * @param mtime - modification time stamped on each entry - defaults to now.
 */
export function buildFaviconZip(f: FaviconFiles, mtime: Date = new Date()): Uint8Array {
    const [svgName, png192Name, png512Name, appleName] = FAVICON_FILE_NAMES;
    return zipSync(
        {
            [svgName]: strToU8(f.svg),
            [png192Name]: [f.png192, {level: 0}],
            [png512Name]: [f.png512, {level: 0}],
            [appleName]: [f.apple180, {level: 0}]
        },
        {level: 6, mtime}
    );
}

/** Download file name for an app's favicon zip, e.g. 'my-app-favicons.zip'. */
export function zipFileName(appName: string): string {
    const slug = kebabCase(appName ?? '')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return `${slug || 'hoist-app'}-favicons.zip`;
}

//------------------
// Implementation
//------------------
async function blobToBytesAsync(blob: Blob): Promise<Uint8Array> {
    return new Uint8Array(await blob.arrayBuffer());
}
