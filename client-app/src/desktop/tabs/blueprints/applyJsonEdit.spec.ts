import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {BlueprintModel, DataCatalog, FakeBlueprintDataProvider} from '@xh/hoist-chat-kit/blueprint';
import type {PlainObject} from '@xh/hoist/core';
import {initTestAppAsync} from '@xh/hoist/test-support';
import {cloneDeep} from 'lodash';
import {afterEach, beforeAll, beforeEach, describe, expect, it} from 'vitest';
import catalogJson from '../../../test-support/blueprintsCatalog.json';
import {applyJsonEdit} from './applyJsonEdit';
import p2 from './scenarios/p2-linked-dashboard.json';
import {createToolboxRegistry} from './toolboxRegistry';

let model: BlueprintModel;

beforeAll(() => initTestAppAsync());

beforeEach(() => {
    const catalog = new DataCatalog(catalogJson as any);
    model = new BlueprintModel({
        blueprint: cloneDeep(p2) as Blueprint,
        catalog,
        registry: createToolboxRegistry(),
        dataProvider: new FakeBlueprintDataProvider({catalog}),
        mode: 'design',
        access: 'write'
    });
});

afterEach(() => model.destroy());

const edited = (fn: (bp: PlainObject) => void) => {
    const ret = cloneDeep(model.blueprint) as PlainObject;
    fn(ret);
    return JSON.stringify(ret);
};

describe('applying edited JSON to a blueprint', () => {
    it('applies the change as one edit, "Edit JSON", in history', () => {
        const {version} = model,
            result = applyJsonEdit(
                model,
                edited(bp => (bp.elements.posGrid.config.groupBy = ['region']))
            );

        expect(result).toEqual({issues: []});
        expect(model.version).toBe(version + 1);
        expect(model.blueprint.elements.posGrid.config.groupBy).toEqual(['region']);
        expect(model.history.at(-1)).toMatchObject({description: 'Edit JSON'});
    });

    it('adds an element with its child reference, and removes it again', () => {
        applyJsonEdit(
            model,
            edited(bp => {
                bp.elements.extraGrid = {
                    component: 'cubeGrid',
                    config: {source: bp.elements.posGrid.config.source}
                };
                bp.elements.dashboard.children.push({id: 'extraGrid', x: 0, y: 14, w: 12, h: 4});
            })
        );
        expect(model.blueprint.elements.extraGrid).toBeTruthy();

        const result = applyJsonEdit(
            model,
            edited(bp => {
                delete bp.elements.extraGrid;
                bp.elements.dashboard.children = bp.elements.dashboard.children.filter(
                    (it: PlainObject) => it.id !== 'extraGrid'
                );
            })
        );
        expect(result.issues).toEqual([]);
        expect(model.blueprint).toEqual(p2);
    });

    it('refuses an edit with errors, says why, and leaves the version alone', () => {
        const {version} = model,
            result = applyJsonEdit(
                model,
                edited(bp => (bp.elements.posGrid.config.groupBy = ['noSuchField']))
            );

        expect(result.issues).toContainEqual(expect.objectContaining({severity: 'error'}));
        expect(model.version).toBe(version);
    });

    it('applies nothing, and reports nothing, when the JSON is unchanged', () => {
        const {version} = model;
        expect(applyJsonEdit(model, JSON.stringify(model.blueprint))).toEqual({issues: []});
        expect(model.version).toBe(version);
    });

    it('reports JSON that does not parse', () => {
        expect(applyJsonEdit(model, '{"root": ').parseError).toBeTruthy();
    });

    it('refuses an edit in run mode', () => {
        model.setMode('run');
        const {version} = model,
            result = applyJsonEdit(
                model,
                edited(bp => (bp.elements.posGrid.config.groupBy = ['region']))
            );

        expect(result.issues).toContainEqual(expect.objectContaining({severity: 'error'}));
        expect(model.version).toBe(version);
    });
});
