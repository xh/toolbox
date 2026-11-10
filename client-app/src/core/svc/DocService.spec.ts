import type {InitContext} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {hoistCore, initTestAppAsync, TestAppModel} from '@xh/hoist/test-support';
import {beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {resolveDocLink} from '../docs/DocUtils';
import type {DocEntry} from '../docs/types';
import {DocService, stripMarkdown} from './DocService';

class DocTestModel extends TestAppModel {
    override async initAsync(ctx: InitContext) {
        await XH.installServicesAsync(DocService, ctx);
    }
}

const longLine =
    'Columns are defined on the GridModel, and each column binds a field from the store to a ' +
    'renderer, with optional sorting, grouping, and a tooltip for the cell value shown.';

/** A docs entry as `hoist-docs export-docs` writes it. `keywords` may be absent. */
function doc(
    id: string,
    title: string,
    viewerCategory: string,
    markdown: string,
    keywords?: string[]
) {
    return {
        id,
        title,
        mcpCategory: 'package',
        viewerCategory,
        description: `${title} docs`,
        ...(keywords ? {keywords} : {}),
        aliases: [],
        markdown
    };
}

/** A docs payload, the docs part of a Hoist Docs index. */
function payload(id: string, name: string, version: string, entries: object[]) {
    return {
        schemaVersion: 1,
        library: {
            id,
            name,
            version,
            language: id === 'react' ? 'typescript' : 'groovy',
            builtAt: ''
        },
        docs: {mcpCategories: [], viewerCategories: [{id: 'overview', title: 'Overview'}], entries}
    };
}

const react = payload('react', '@xh/hoist', '91.0', [
        doc(
            'docs/README.md',
            'Hoist React',
            'overview',
            '# Hoist React\n\nStart with the **core** package.',
            ['intro']
        ),
        doc(
            'cmp/grid/README.md',
            'Grid',
            'components',
            `# Grid\n\nIntro line.\n\n## Columns\n\n${longLine}`
        )
    ]),
    core = payload('core', 'io.xh:hoist-core', '45.0', [
        doc(
            'docs/authentication.md',
            'Authentication',
            'security',
            '# Authentication\n\n## OAuth\n\nOAuth flows for signing users in with a grid of providers.'
        )
    ]);

/** Absolute URL of a docs file, as the browser requests it - served beside the client. */
const docsUrl = (file: string) => `${window.location.origin}/public/hoist-docs/${file}`;

beforeAll(async () => {
    // A recent-docs entry saved by an earlier session, plus one for a doc no longer registered.
    localStorage.setItem(
        'toolbox.jdoe.docs.recentDocs',
        JSON.stringify(['hoist-core:docs/authentication.md', 'hoist-react:gone.md'])
    );
    hoistCore.route('GET', docsUrl('index.json'), () => [
        {id: 'react', name: '@xh/hoist', version: '91.0', file: 'react.json'},
        {id: 'core', name: 'io.xh:hoist-core', version: '45.0', file: 'core.json'}
    ]);
    hoistCore.route('GET', docsUrl('react.json'), () => react);
    hoistCore.route('GET', docsUrl('core.json'), () => core);
    await initTestAppAsync({modelClass: DocTestModel});
});

const svc = () => XH.docService,
    entry = (id: string, source = 'hoist-react'): DocEntry => svc().getDocEntry(id, source);

describe('registry', () => {
    it('defaults missing keywords to an empty list', () => {
        expect(entry('cmp/grid/README.md').keywords).toEqual([]);
        expect(entry('docs/README.md').keywords).toEqual(['intro']);
    });

    it('reports each source at the version Toolbox runs', () => {
        expect(svc().sourceInfo['hoist-react']).toMatchObject({
            label: 'Hoist React',
            version: '91.0',
            versions: ['91.0']
        });
        expect(svc().sourceNames).toEqual(['hoist-react', 'hoist-core']);
    });

    it('restores recent docs from local storage, dropping unknown ones', () => {
        expect(svc().recentDocs.map(it => it.id)).toEqual(['docs/authentication.md']);
    });
});

describe('fetchContentAsync', () => {
    it('serves content from the loaded docs, with no further requests', async () => {
        const before = hoistCore.requestsTo(docsUrl('react.json')).length;
        expect(await svc().fetchContentAsync('hoist-core', 'docs/authentication.md')).toContain(
            'OAuth flows'
        );
        expect(hoistCore.requestsTo(docsUrl('react.json'))).toHaveLength(before);
    });

    it('rejects an unknown doc', async () => {
        await expect(svc().fetchContentAsync('hoist-react', 'missing.md')).rejects.toThrow(
            'Doc not found'
        );
    });
});

describe('searchDocsAsync', () => {
    it('ranks docs in the browser, each once under its best section', async () => {
        const results = await svc().searchDocsAsync('grid Tooltip');

        expect(results[0].entry).toBe(entry('cmp/grid/README.md'));
        expect(results[0].section).toBe('Columns');
        expect(results[0].snippet).toBe(longLine);
        expect(results[0].matchedTerms).toEqual(['grid', 'tooltip']);
        const keys = results.map(r => `${r.entry.source}:${r.entry.id}`);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it('returns no results for a blank query', async () => {
        expect(await svc().searchDocsAsync('  ')).toEqual([]);
    });
});

describe('stripMarkdown', () => {
    it('reduces markdown to plain text, keeping link and code text', () => {
        expect(
            stripMarkdown(
                '`@persist` and **bold** _em_ [GridModel](cmp/grid/README.md) | `a` | b | ## Head'
            )
        ).toBe('@persist and bold em GridModel a b Head');
    });

    it('leaves snake_case and multiplication alone', () => {
        expect(stripMarkdown('use persist_with and 2 * 3 * 4')).toBe(
            'use persist_with and 2 * 3 * 4'
        );
    });
});

describe('noteRecentlyViewed', () => {
    beforeEach(() => svc().noteRecentlyViewed(entry('docs/authentication.md', 'hoist-core')));

    it('moves a doc to the front without duplicating it, and saves the list', () => {
        svc().noteRecentlyViewed(entry('docs/README.md'));
        svc().noteRecentlyViewed(entry('docs/authentication.md', 'hoist-core'));

        expect(svc().recentDocs.map(it => it.id)).toEqual([
            'docs/authentication.md',
            'docs/README.md'
        ]);
        expect(XH.localStorageService.get('docs.recentDocs')).toEqual([
            'hoist-core:docs/authentication.md',
            'hoist-react:docs/README.md'
        ]);
    });

    it('keeps the 8 most recent', () => {
        for (let i = 0; i < 10; i++) {
            svc().noteRecentlyViewed({...entry('docs/README.md'), id: `doc${i}.md`});
        }
        expect(svc().recentDocs).toHaveLength(8);
        expect(svc().recentDocs[0].id).toBe('doc9.md');
    });
});

describe('resolveDocLink', () => {
    it('resolves a relative link within the same source', () => {
        expect(resolveDocLink(entry('cmp/grid/README.md'), '../../docs/README.md#setup')).toBe(
            entry('docs/README.md')
        );
    });

    it('resolves a cross-repo link to the other source', () => {
        const target = entry('docs/authentication.md', 'hoist-core');
        expect(
            resolveDocLink(entry('docs/README.md'), '../../hoist-core/docs/authentication.md')
        ).toBe(target);
    });

    it('leaves external, anchor and unknown links unresolved', () => {
        const from = entry('docs/README.md');
        expect(resolveDocLink(from, 'https://xh.io')).toBeUndefined();
        expect(resolveDocLink(from, '#usage')).toBeUndefined();
        expect(resolveDocLink(from, 'missing.md')).toBeUndefined();
    });
});
