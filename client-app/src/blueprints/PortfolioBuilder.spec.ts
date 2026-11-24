import {BlueprintModel, DataCatalog} from '@xh/hoist-chat-kit/blueprint';
import {FakeBlueprintDataProvider} from '@xh/hoist-chat-kit/blueprint/demo';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {afterEach, beforeAll, beforeEach, describe, expect, it} from 'vitest';
import catalogJson from '../test-support/blueprintsCatalog.json';
import {PortfolioBuilderModel} from './PortfolioBuilder';
import {createToolboxRegistry} from './toolboxRegistry';

const instruments = [
    {symbol: 'AAA', name: 'AAA Holdings', sector: 'Energy'},
    {symbol: 'BBB', name: 'BBB Inc', sector: 'Technology'},
    {symbol: 'CCC', name: 'CCC Group', sector: 'Utilities'}
];

let bpModel: BlueprintModel, builder: PortfolioBuilderModel;

beforeAll(async () => {
    hoistCore.route('GET', 'blueprints/symbols', () => instruments);
    await initTestAppAsync();
});

beforeEach(async () => {
    const catalog = new DataCatalog(catalogJson as any);
    bpModel = new BlueprintModel({
        catalog,
        registry: createToolboxRegistry(),
        dataProvider: new FakeBlueprintDataProvider({catalog})
    });
    const issues = bpModel.setBlueprint({
        variables: {
            portfolio: {type: 'toolbox.portfolio', label: 'Portfolio', setBy: {element: 'builder'}}
        },
        root: 'builder',
        elements: {builder: {component: 'toolbox.portfolioBuilder', config: {maxHoldings: 2}}}
    });
    expect(issues.filter(it => it.severity === 'error')).toEqual([]);
    builder = new PortfolioBuilderModel({
        blueprintModel: bpModel,
        id: 'builder',
        renderElement: () => null
    });
    await builder.loadAsync();
});

afterEach(() => {
    builder.destroy();
    bpModel.destroy();
});

const portfolio = () => bpModel.getVariable('portfolio').value;

describe('portfolioBuilder', () => {
    it('starts empty, with the instruments it can add', () => {
        expect(portfolio()).toBeNull();
        expect(builder.addOptions.map(it => it.value)).toEqual(['AAA', 'BBB', 'CCC']);
    });

    it('adds each symbol at what is left of 100%, up to maxHoldings', () => {
        builder.addHolding('AAA');
        expect(portfolio()).toEqual({holdings: [{symbol: 'AAA', weight: 1}]});
        builder.addHolding('BBB');
        builder.addHolding('CCC');
        expect(portfolio()).toEqual({
            holdings: [
                {symbol: 'AAA', weight: 1},
                {symbol: 'BBB', weight: 0}
            ]
        });
        expect(builder.isFull).toBe(true);
        expect(builder.addOptions.map(it => it.value)).toEqual(['CCC']);
    });

    it('sets a weight edited in the grid', () => {
        builder.addHolding('AAA');
        builder.addHolding('BBB');
        builder.gridModel.store.modifyRecords({id: 'AAA', weight: 0.6});
        expect(portfolio()).toEqual({
            holdings: [
                {symbol: 'AAA', weight: 0.6},
                {symbol: 'BBB', weight: 0}
            ]
        });
        expect(builder.totalWeight).toBeCloseTo(0.6);
    });

    it('sets null when the last holding is removed', async () => {
        builder.addHolding('AAA');
        await builder.gridModel.selectAsync('AAA');
        builder.removeSelected();
        expect(portfolio()).toBeNull();
    });

    it('shows a portfolio set from outside the widget', () => {
        bpModel.setVariable('portfolio', {holdings: [{symbol: 'CCC', weight: 0.25}]});
        expect(builder.gridModel.store.records.map(it => it.data)).toMatchObject([
            {symbol: 'CCC', weight: 0.25}
        ]);
        expect(builder.addOptions.map(it => it.value)).toEqual(['AAA', 'BBB']);
    });
});
