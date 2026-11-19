import {DataCatalog, FakeBlueprintDataProvider} from '@xh/hoist-chat-kit/blueprint';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {BlueprintsPanelModel} from './BlueprintsPanelModel';
import p1 from './scenarios/p1-one-grid.json';
import p2 from './scenarios/p2-linked-dashboard.json';

let model: BlueprintsPanelModel, catalogRequests: number;

beforeAll(async () => {
    await initTestAppAsync();
    model = new BlueprintsPanelModel(catalog => new FakeBlueprintDataProvider({catalog}));
    await model.loadAsync();
    catalogRequests = hoistCore.requestsTo('blueprints/catalog').length;
});

afterAll(() => model.destroy());

const applyJson = (json: unknown) => {
    model.draft = typeof json === 'string' ? json : JSON.stringify(json);
    model.apply();
};

describe('Blueprints JSON harness', () => {
    it('builds its model from the server catalog', () => {
        expect(catalogRequests).toBe(1);
        expect(model.blueprintModel.catalog).toBeInstanceOf(DataCatalog);
    });

    it('applies the first scenario once the catalog loads', () => {
        expect(model.blueprintModel.blueprint).toEqual(p1);
        expect(model.hasErrors).toBe(false);
    });

    it('reports each error with its path, and keeps the last valid blueprint', () => {
        applyJson({...p1, elements: {posGrid: {component: 'noSuchWidget'}}});

        expect(model.hasErrors).toBe(true);
        expect(model.issues).toContainEqual(
            expect.objectContaining({
                code: 'element.unknownComponent',
                severity: 'error',
                path: '/elements/posGrid/component'
            })
        );
        expect(model.blueprintModel.blueprint).toEqual(p1);
    });

    it('reports a draft that is not JSON apart from validation issues', () => {
        applyJson('{"root": ');
        expect(model.parseError).toBeTruthy();
        expect(model.hasErrors).toBe(true);
        expect(model.blueprintModel.blueprint).toEqual(p1);

        applyJson(p1);
        expect(model.parseError).toBeNull();
        expect(model.hasErrors).toBe(false);
    });

    it('loads and applies a scenario when one is picked', () => {
        model.scenario = 'p2';
        expect(JSON.parse(model.draft)).toEqual(p2);
        expect(model.blueprintModel.blueprint).toEqual(p2);
        expect(model.issues.filter(it => it.severity === 'error')).toEqual([]);
    });
});
