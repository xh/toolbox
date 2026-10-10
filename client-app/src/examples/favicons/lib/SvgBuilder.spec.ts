import {faGear} from '@fortawesome/pro-regular-svg-icons';
import {describe, expect, it} from 'vitest';
import type {FaviconShape, FaviconSpec, Glyph} from './FaviconSpec';
import {DEFAULT_SPEC, glyphFromDefinition} from './FaviconSpec';
import {buildFaviconSvg, svgToDataUrl} from './SvgBuilder';

const gear = glyphFromDefinition(faGear),
    twoPath: Glyph = {
        prefix: 'fas',
        iconName: 'test-svg-two-path',
        width: 512,
        height: 512,
        paths: ['M0 0H256V512H0Z', 'M256 0H512V512H256Z']
    };

describe('buildFaviconSvg', () => {
    it('produces well-formed standalone SVG for every shape and variant', () => {
        for (const shape of SHAPES) {
            for (const variant of ['main', 'apple'] as const) {
                const svg = buildFaviconSvg(gear, withShape(shape), {variant, comment: 'a--b'});
                expect(parse(svg).getElementsByTagName('parsererror').length).toBe(0);
            }
        }
    });

    it('has xmlns and viewBox, one path per glyph path, and no currentColor or class', () => {
        const svg = buildFaviconSvg(twoPath, DEFAULT_SPEC),
            root = parse(svg).documentElement;
        expect(root.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
        expect(root.getAttribute('viewBox')).toBe('0 0 512 512');

        const paths = root.getElementsByTagName('path');
        expect(paths.length).toBe(2);
        expect(paths[0].getAttribute('d')).toBe(twoPath.paths[0]);
        expect(paths[1].getAttribute('d')).toBe(twoPath.paths[1]);
        expect(paths[0].getAttribute('fill')).toBe(DEFAULT_SPEC.fgColor);
        expect(paths[0].getAttribute('transform')).toMatch(/^matrix\((-?[\d.]+ ){5}-?[\d.]+\)$/);

        expect(svg).not.toContain('currentColor');
        expect(svg).not.toContain('class');
    });

    it('draws the backdrop for each shape', () => {
        const bg = '#0b4f6c';

        const square = backdrop(buildFaviconSvg(gear, withShape('square', {bgColor: bg})));
        expect(square.tagName).toBe('rect');
        expect(square.getAttribute('width')).toBe('512');
        expect(square.getAttribute('height')).toBe('512');
        expect(square.hasAttribute('rx')).toBe(false);
        expect(square.getAttribute('fill')).toBe(bg);

        const rounded = backdrop(
            buildFaviconSvg(gear, withShape('rounded', {bgColor: bg, radius: 20}))
        );
        expect(rounded.tagName).toBe('rect');
        expect(rounded.getAttribute('rx')).toBe('102.4');
        expect(rounded.getAttribute('fill')).toBe(bg);

        const circle = backdrop(buildFaviconSvg(gear, withShape('circle', {bgColor: bg})));
        expect(circle.tagName).toBe('circle');
        expect(['cx', 'cy', 'r'].map(a => circle.getAttribute(a))).toEqual(['256', '256', '256']);
        expect(circle.getAttribute('fill')).toBe(bg);

        const none = parse(buildFaviconSvg(gear, withShape('none', {bgColor: bg}))).documentElement;
        expect(none.children[0].tagName).toBe('path');
        expect(none.getElementsByTagName('rect').length).toBe(0);
        expect(none.getElementsByTagName('circle').length).toBe(0);
    });

    it('always uses a full square backdrop for the apple variant, with a rounded-square fit', () => {
        for (const shape of SHAPES) {
            const svg = buildFaviconSvg(gear, withShape(shape, {padding: 6}), {variant: 'apple'}),
                el = backdrop(svg);
            expect(el.tagName, shape).toBe('rect');
            expect(el.hasAttribute('rx'), shape).toBe(false);
            expect(el.getAttribute('fill'), shape).toBe(DEFAULT_SPEC.bgColor);
        }

        const apple = buildFaviconSvg(gear, withShape('none', {padding: 6}), {variant: 'apple'}),
            asRounded = buildFaviconSvg(gear, withShape('rounded', {radius: 22, padding: 10}));
        expect(transformOf(apple)).toBe(transformOf(asRounded));
    });

    it('sets width and height from size, keeping the 512 viewBox', () => {
        const root = parse(buildFaviconSvg(gear, DEFAULT_SPEC, {size: 180})).documentElement;
        expect(root.getAttribute('width')).toBe('180');
        expect(root.getAttribute('height')).toBe('180');
        expect(root.getAttribute('viewBox')).toBe('0 0 512 512');

        const dflt = parse(buildFaviconSvg(gear, DEFAULT_SPEC)).documentElement;
        expect(dflt.getAttribute('width')).toBe('512');
    });

    it('strips double hyphens from the comment', () => {
        const svg = buildFaviconSvg(gear, DEFAULT_SPEC, {comment: 'a--b---c-d'}),
            comments = Array.from(parse(svg).documentElement.childNodes).filter(
                n => n.nodeType === 8 // COMMENT_NODE
            );
        expect(comments.length).toBe(1);
        expect(comments[0].textContent).toBe(' a-b-c-d ');
    });

    it('omits the comment when none is given', () => {
        expect(buildFaviconSvg(gear, DEFAULT_SPEC)).not.toContain('<!--');
    });

    it('writes compact numbers, never -0', () => {
        const svg = buildFaviconSvg(twoPath, withShape('none', {padding: 0, flipH: true}));
        expect(transformOf(svg)).toBe('matrix(-1 0 0 1 512 0)');
    });

    it('renders a synthetic glyph exactly', () => {
        const glyph: Glyph = {
                prefix: 'fas',
                iconName: 'test-svg-snapshot',
                width: 640,
                height: 512,
                paths: ['M0 0H640V512H0Z']
            },
            spec: FaviconSpec = {
                ...DEFAULT_SPEC,
                fgColor: '#ffffff',
                bgColor: '#1976d2',
                shape: 'rounded',
                radius: 20,
                padding: 14,
                rotation: 90
            };
        expect(buildFaviconSvg(glyph, spec, {size: 32, comment: 'Made with -- test'}))
            .toMatchInlineSnapshot(`
              "<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512">
              <!-- Made with - test -->
              <rect width="512" height="512" rx="102.4" fill="#1976d2"/>
              <path fill="#ffffff" transform="matrix(0 0.576 -0.576 0 403.456 71.68)" d="M0 0H640V512H0Z"/>
              </svg>"
            `);
    });
});

describe('svgToDataUrl', () => {
    it('URI-encodes the SVG with a utf-8 SVG media type', () => {
        const svg = buildFaviconSvg(gear, DEFAULT_SPEC, {comment: 'https://x.io/?a=1&b=#2'}),
            url = svgToDataUrl(svg);
        expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
        expect(url).not.toMatch(/[#<>"\s]/);
        expect(decodeURIComponent(url.slice(url.indexOf(',') + 1))).toBe(svg);
    });
});

//------------------
// Helpers
//------------------
const SHAPES: FaviconShape[] = ['none', 'square', 'rounded', 'circle'];

function withShape(shape: FaviconShape, overrides: Partial<FaviconSpec> = {}): FaviconSpec {
    return {...DEFAULT_SPEC, shape, ...overrides};
}

function parse(svg: string): Document {
    return new DOMParser().parseFromString(svg, 'image/svg+xml');
}

function backdrop(svg: string): Element {
    return parse(svg).documentElement.children[0];
}

function transformOf(svg: string): string {
    return parse(svg).getElementsByTagName('path')[0].getAttribute('transform');
}
