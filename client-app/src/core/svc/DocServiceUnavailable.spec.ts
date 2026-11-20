import type {InitContext} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {hoistCore, hoistError, initTestAppAsync, TestAppModel} from '@xh/hoist/test-support';
import {beforeAll, describe, expect, it} from 'vitest';
import {DocService} from './DocService';

class DocTestModel extends TestAppModel {
    override async initAsync(ctx: InitContext) {
        await XH.installServicesAsync(DocService, ctx);
    }
}

const docsUrl = (file: string) => `${window.location.origin}/public/hoist-docs/${file}`;

// The docs were not exported when the app starts, so their files are missing.
let exported = false;

beforeAll(async () => {
    hoistCore.route('GET', docsUrl('index.json'), () =>
        exported
            ? [{id: 'react', name: '@xh/hoist', version: '91.0', file: 'react.json'}]
            : hoistError(404, {name: 'NotFound', message: 'Not found'})
    );
    hoistCore.route('GET', docsUrl('react.json'), () => ({
        schemaVersion: 1,
        library: {
            id: 'react',
            name: '@xh/hoist',
            version: '91.0',
            language: 'typescript',
            builtAt: ''
        },
        docs: {
            entries: [
                {
                    id: 'docs/README.md',
                    title: 'Hoist React',
                    mcpCategory: 'index',
                    viewerCategory: 'overview',
                    markdown: '# Hoist React'
                }
            ]
        }
    }));
    await initTestAppAsync({modelClass: DocTestModel});
});

describe('when the docs cannot be loaded', () => {
    it('still installs, flagged as unavailable with an empty registry', () => {
        expect(XH.docService.unavailable).toBe(true);
        expect(XH.docService.registry).toEqual([]);
    });

    it('returns no search results', async () => {
        expect(await XH.docService.searchDocsAsync('grid')).toEqual([]);
    });

    it('recovers on retry once the docs are there', async () => {
        exported = true;
        await XH.docService.retryAsync();
        expect(XH.docService.unavailable).toBe(false);
        expect(XH.docService.registry.map(it => it.id)).toEqual(['docs/README.md']);
    });
});
