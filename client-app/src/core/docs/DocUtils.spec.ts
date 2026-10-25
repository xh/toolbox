import {describe, expect, it} from 'vitest';
import {
    decodeDocId,
    docRouteParams,
    encodeDocId,
    extractSections,
    sameDoc,
    slugify
} from './DocUtils';
import type {DocEntry} from './types';

describe('doc ids', () => {
    it('round-trips a file path through a single route param', () => {
        const id = 'cmp/grid/README.md',
            encoded = encodeDocId(id);
        expect(encoded).toBe('cmp~grid~README.md');
        expect(encoded).not.toContain('/');
        expect(decodeDocId(encoded)).toBe(id);
    });

    it('matches docs on source and id together', () => {
        const entry = (source: string, id: string) => ({source, id}) as DocEntry;
        expect(sameDoc(entry('hoist-react', 'a.md'), entry('hoist-react', 'a.md'))).toBe(true);
        expect(sameDoc(entry('hoist-react', 'a.md'), entry('hoist-core', 'a.md'))).toBe(false);
    });
});

describe('docRouteParams', () => {
    it('routes $HR and $HC links to their source, with an optional section', () => {
        expect(docRouteParams('$HR/cmp/grid/README.md#tree-grids')).toEqual({
            source: 'hoist-react',
            docId: 'cmp~grid~README.md',
            section: 'tree-grids'
        });
        expect(docRouteParams('$HC/docs/authentication.md')).toEqual({
            source: 'hoist-core',
            docId: 'docs~authentication.md',
            section: null
        });
    });

    it('leaves source code, unknown repos and bare tokens to external handling', () => {
        expect(docRouteParams('$HR/cmp/grid/GridModel.ts')).toBeNull();
        expect(docRouteParams('$XX/docs/README.md')).toBeNull();
        expect(docRouteParams('$HR')).toBeNull();
        expect(docRouteParams('https://xh.io/docs/README.md')).toBeNull();
    });
});

describe('extractSections', () => {
    it('lists H2 headings only, as plain text with slug ids', () => {
        const md = [
            '# Title',
            '## Getting `GridModel` Started',
            'Body text with ## not a heading',
            '### Subsection',
            '## The [Store](./store.md) API',
            '## **Bold** and *italic*'
        ].join('\n');

        expect(extractSections(md)).toEqual([
            {id: 'getting-gridmodel-started', title: 'Getting GridModel Started'},
            {id: 'the-store-api', title: 'The Store API'},
            {id: 'bold-and-italic', title: 'Bold and italic'}
        ]);
    });

    it('suffixes repeated headings so each id is unique', () => {
        const md = '## Usage\n## Usage\n## Usage';
        expect(extractSections(md).map(it => it.id)).toEqual(['usage', 'usage-1', 'usage-2']);
    });
});

describe('slugify', () => {
    it.each([
        ['Hello World', 'hello-world'],
        ['  Leading and trailing  ', 'leading-and-trailing'],
        ['Punctuation: removed!', 'punctuation-removed'],
        ['Already-hyphenated - and spaced', 'already-hyphenated-and-spaced'],
        ['snake_case stays', 'snake_case-stays']
    ])('%s -> %s', (text, slug) => {
        expect(slugify(text)).toBe(slug);
    });
});
