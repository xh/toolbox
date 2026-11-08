import type {InitContext} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {hoistCore, initTestAppAsync, TestAppModel} from '@xh/hoist/test-support';
import {beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {resolveDocLink} from '../docs/DocUtils';
import type {DocEntry} from '../docs/types';
import {DocService} from './DocService';

class DocTestModel extends TestAppModel {
    override async initAsync(ctx: InitContext) {
        await XH.installServicesAsync(DocService, ctx);
    }
}

// Registry entries as the server's DocsService sends them. `keywords` is optional on the wire.
const entries = [
    {
        id: 'docs/README.md',
        source: 'hoist-react',
        title: 'Hoist React',
        category: 'overview',
        description: 'Framework overview',
        keywords: ['intro']
    },
    {
        id: 'cmp/grid/README.md',
        source: 'hoist-react',
        title: 'Grid',
        category: 'components',
        description: 'Data grids'
    },
    {
        id: 'docs/authentication.md',
        source: 'hoist-core',
        title: 'Authentication',
        category: 'security',
        description: 'Server auth'
    }
];

const longLine =
    'Columns are defined on the GridModel, and each column binds a field from the store to a ' +
    'renderer, with optional sorting, grouping, and a tooltip for the cell value shown.';

const contents: Record<string, string> = {
    'docs/README.md': '# Hoist React\n\nStart with the **core** package.',
    'cmp/grid/README.md': `# Grid\n\nIntro line.\n\n${longLine}`,
    'docs/authentication.md': '# Authentication\n\nOAuth flows.'
};

beforeAll(async () => {
    // A recent-docs entry saved by an earlier session, plus one for a doc no longer registered.
    localStorage.setItem(
        'toolbox.jdoe.docs.recentDocs',
        JSON.stringify(['hoist-core:docs/authentication.md', 'hoist-react:gone.md'])
    );
    hoistCore.route('GET', 'docs/registry', () => ({
        entries,
        sources: {
            'hoist-react': {
                label: 'Hoist React',
                categories: [],
                version: '91.0',
                versions: ['91.0', '90.1']
            },
            'hoist-core': {label: 'Hoist Core', categories: [], version: '45.0', versions: ['45.0']}
        }
    }));
    // A registry request that names versions goes as a form POST, like any request with params.
    hoistCore.route('POST', 'docs/registry', () => ({
        entries,
        sources: {
            'hoist-react': {
                label: 'Hoist React',
                categories: [],
                version: '90.1',
                versions: ['91.0', '90.1']
            },
            'hoist-core': {label: 'Hoist Core', categories: [], version: '45.0', versions: ['45.0']}
        }
    }));
    // The server ranks results with the Hoist Docs service - see DocsService.groovy.
    hoistCore.route('POST', 'docs/search', () => ({
        results: [
            {
                source: 'hoist-react',
                id: 'cmp/grid/README.md',
                score: 12.5,
                section: 'Columns',
                snippet: longLine
            },
            {
                source: 'hoist-react',
                id: 'gone.md',
                score: 3,
                section: 'Intro',
                snippet: 'Unregistered.'
            },
            {
                source: 'hoist-core',
                id: 'docs/authentication.md',
                score: 2.5,
                section: 'OAuth',
                snippet: ''
            }
        ]
    }));
    // FetchService sends a request with params as a form POST.
    hoistCore.route('POST', 'docs/content', req => ({content: contents[req.form.docId]}));
    await initTestAppAsync({modelClass: DocTestModel});
});

const svc = () => XH.docService,
    entry = (id: string, source = 'hoist-react'): DocEntry => svc().getDocEntry(id, source);

describe('registry', () => {
    it('defaults missing keywords to an empty list', () => {
        expect(entry('cmp/grid/README.md').keywords).toEqual([]);
        expect(entry('docs/README.md').keywords).toEqual(['intro']);
    });

    it('restores recent docs from local storage, dropping unknown ones', () => {
        expect(svc().recentDocs.map(it => it.id)).toEqual(['docs/authentication.md']);
    });
});

describe('fetchContentAsync', () => {
    it('fetches each doc once, then serves it from the cache', async () => {
        await svc().fetchContentAsync('hoist-react', 'docs/README.md');
        await svc().fetchContentAsync('hoist-react', 'docs/README.md');
        expect(hoistCore.requestsTo('docs/content')).toHaveLength(1);
        expect(hoistCore.requestsTo('docs/content')[0].form).toEqual({
            source: 'hoist-react',
            docId: 'docs/README.md'
        });
    });
});

describe('searchDocsAsync', () => {
    it('maps ranked server results onto registry entries, dropping unknown docs', async () => {
        const results = await svc().searchDocsAsync('grid Tooltip');

        expect(results.map(r => [r.entry.id, r.section])).toEqual([
            ['cmp/grid/README.md', 'Columns'],
            ['docs/authentication.md', 'OAuth']
        ]);
        expect(results[0].snippet).toBe(longLine);
        expect(results[1].snippet).toBe(null);
        expect(results[0].matchedTerms).toEqual(['grid', 'tooltip']);
    });

    it('returns no results for a blank query, without calling the server', async () => {
        const before = hoistCore.requestsTo('docs/search').length;
        expect(await svc().searchDocsAsync('  ')).toEqual([]);
        expect(hoistCore.requestsTo('docs/search')).toHaveLength(before);
    });
});

describe('setVersionAsync', () => {
    it('reloads the registry at the chosen version and refetches content for it', async () => {
        await svc().fetchContentAsync('hoist-react', 'cmp/grid/README.md');
        await svc().setVersionAsync('hoist-react', '90.1');

        expect(svc().sourceInfo['hoist-react'].version).toBe('90.1');
        await svc().fetchContentAsync('hoist-react', 'cmp/grid/README.md');
        const contentRequests = hoistCore.requestsTo('docs/content');
        expect(contentRequests.at(-1).form).toEqual({
            source: 'hoist-react',
            docId: 'cmp/grid/README.md',
            'hoist-react': '90.1'
        });
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
