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

// Hoist Docs is down when the app starts. Toolbox's server answers as DocsService does then.
let hoistDocsUp = false;

beforeAll(async () => {
    hoistCore.route('GET', 'docs/registry', () =>
        hoistDocsUp
            ? {
                  entries: [
                      {
                          id: 'docs/README.md',
                          source: 'hoist-react',
                          title: 'Hoist React',
                          category: 'overview',
                          description: ''
                      }
                  ],
                  sources: {
                      'hoist-react': {
                          label: 'Hoist React',
                          categories: [],
                          version: '91.0',
                          versions: ['91.0']
                      }
                  }
              }
            : hoistError(400, {
                  name: 'DataNotAvailableException',
                  message: 'Hoist Docs is unavailable'
              })
    );
    hoistCore.route('POST', 'docs/search', () =>
        hoistError(400, {name: 'DataNotAvailableException', message: 'Hoist Docs is unavailable'})
    );
    await initTestAppAsync({modelClass: DocTestModel});
});

describe('when Hoist Docs is unavailable', () => {
    it('still installs, flagged as unavailable with an empty registry', () => {
        expect(XH.docService.unavailable).toBe(true);
        expect(XH.docService.registry).toEqual([]);
    });

    it('rejects a search, for the viewers to show as a message', async () => {
        await expect(XH.docService.searchDocsAsync('grid')).rejects.toThrow();
    });

    it('recovers on retry once Hoist Docs is back', async () => {
        hoistDocsUp = true;
        await XH.docService.retryAsync();
        expect(XH.docService.unavailable).toBe(false);
        expect(XH.docService.registry.map(it => it.id)).toEqual(['docs/README.md']);
    });
});
