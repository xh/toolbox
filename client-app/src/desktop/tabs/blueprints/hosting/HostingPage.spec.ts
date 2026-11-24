import {DataCatalog, validateBlueprint} from '@xh/hoist-chat-kit/blueprint';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {beforeAll, describe, expect, it, vi} from 'vitest';
import {createPortfolioRegistry} from '../../../../blueprints/toolboxRegistry';
import catalogJson from '../../../../test-support/blueprintsCatalog.json';
import {HOSTING_BLUEPRINT, HostingPageModel} from './HostingPage';

beforeAll(async () => {
    await initTestAppAsync();
    hoistCore.route('GET', 'blueprints/catalog', () => catalogJson);
    hoistCore.route('POST', 'blueprints/data', () => ({rows: []}));
});

const lastDataRequest = () => hoistCore.requestsTo('blueprints/data').at(-1)?.json;

describe('HostingPageModel', () => {
    it('hosts a blueprint whose fund only the page sets', () => {
        const catalog = new DataCatalog(catalogJson as any),
            registry = createPortfolioRegistry();
        expect(validateBlueprint(HOSTING_BLUEPRINT, {catalog, registry})).toEqual([]);
        expect(HOSTING_BLUEPRINT.variables.fund.setBy).toBe('host');
    });

    it("sets the blueprint's fund from its own control, and the positions follow", async () => {
        const model = new HostingPageModel();
        model.fund = 'Oak Mount';
        await model.loadAsync();
        const {blueprintModel} = model;

        expect(blueprintModel.getVariable('fund').value).toBe('Oak Mount');
        await vi.waitFor(() => expect(lastDataRequest()?.params.fund).toBe('Oak Mount'));

        model.fund = 'Birch Hill';
        expect(blueprintModel.getVariable('fund').value).toBe('Birch Hill');
        await vi.waitFor(() => expect(lastDataRequest()?.params.fund).toBe('Birch Hill'));

        model.fund = null;
        expect(blueprintModel.getVariable('fund').value).toBeNull();
        model.destroy();
    });
});
