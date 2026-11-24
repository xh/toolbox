import type {
    BlueprintSchema,
    BlueprintWidgetConfig,
    WidgetSpec
} from '@xh/hoist-chat-kit/blueprint';
import {BlueprintWidgetModel} from '@xh/hoist-chat-kit/blueprint';
import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {filler, hbox, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, managed, uses, XH} from '@xh/hoist/core';
import type {LoadSpec} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {numberEditor} from '@xh/hoist/desktop/cmp/grid';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtPercent} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {computed, observableRef, runInAction} from '@xh/hoist/mobx';
import {isEqual, sumBy} from 'lodash';
import {renderTicker} from './Ticker';

export interface Holding {
    symbol: string;
    /** A fraction: 0.5 is half the portfolio. */
    weight: number;
}

export interface Portfolio {
    holdings: Holding[];
}

export interface PortfolioBuilderConfig {
    maxHoldings?: number;
}

const CONFIG_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {maxHoldings: {type: 'integer', minimum: 1, maximum: 500}}
} as const satisfies BlueprintSchema;

export interface InstrumentOption {
    symbol: string;
    name: string;
    sector: string;
}

/**
 * The `portfolioBuilder` app widget: a hypothetical portfolio of tickers and weights, the value of
 * the `portfolio` variable whose `setBy` names it. Each add, remove or weight edit sets the
 * variable. An empty portfolio sets it to null.
 */
export class PortfolioBuilderModel extends BlueprintWidgetModel<PortfolioBuilderConfig> {
    @observableRef accessor instruments: InstrumentOption[] = [];

    @managed gridModel = new GridModel({
        store: {
            idSpec: 'symbol',
            fields: [
                {name: 'symbol', type: 'string'},
                {name: 'weight', type: 'number'}
            ]
        },
        selModel: 'multiple',
        emptyText: 'Add a symbol to start a portfolio.',
        clicksToEdit: 1,
        columns: [
            {field: 'symbol', flex: 1, minWidth: 120, renderer: renderTicker},
            {
                field: 'weight',
                width: 100,
                align: 'right',
                editable: true,
                editor: props => numberEditor({...props, inputProps: {scaleFactor: 100}}),
                renderer: v => fmtPercent(v, {precision: 2})
            }
        ]
    });

    @computed
    get holdings(): Holding[] {
        return (this.value as Portfolio)?.holdings ?? [];
    }

    get maxHoldings(): number {
        return this.resolvedConfig.maxHoldings ?? null;
    }

    get isFull(): boolean {
        const {maxHoldings} = this;
        return maxHoldings != null && this.holdings.length >= maxHoldings;
    }

    @computed
    get totalWeight(): number {
        return sumBy(this.holdings, 'weight');
    }

    /** Instruments not yet held, for the add select. */
    @computed
    get addOptions() {
        const held = new Set(this.holdings.map(it => it.symbol));
        return this.instruments
            .filter(it => !held.has(it.symbol))
            .map(it => ({value: it.symbol, label: `${it.symbol} ${it.name}`, ...it}));
    }

    constructor(config: BlueprintWidgetConfig) {
        super(config);
        const {store} = this.gridModel;
        this.addReaction(
            {
                track: () => this.holdings,
                run: holdings => this.gridModel.loadData(holdings),
                fireImmediately: true
            },
            {
                track: () => store.records.map(it => it.data),
                run: rows => this.commit(rows.map(({symbol, weight}) => ({symbol, weight})))
            }
        );
        this.loadAsync();
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const instruments = await XH.fetchJson({url: 'blueprints/symbols'}, {loadSpec});
        if (!loadSpec.isStale) runInAction(() => (this.instruments = instruments));
    }

    /** Add a symbol, weighted at whatever is left of 100%. */
    addHolding(symbol: string) {
        if (!symbol || this.isFull || this.holdings.some(it => it.symbol === symbol)) return;
        const weight = Math.max(0, 1 - this.totalWeight);
        this.commit([...this.holdings, {symbol, weight}]);
    }

    removeSelected() {
        const gone = new Set(this.gridModel.selectedIds);
        this.commit(this.holdings.filter(it => !gone.has(it.symbol)));
    }

    //------------------
    // Implementation
    //------------------
    private commit(holdings: Holding[]) {
        const value: Portfolio = holdings.length ? {holdings} : null;
        if (!this.valueVariable || isEqual(value, this.value ?? null)) return;
        this.setValue(value);
    }
}

export const portfolioBuilder = hoistCmp.factory({
    displayName: 'PortfolioBuilder',
    model: uses(PortfolioBuilderModel),

    render({model}) {
        const {holdings, totalWeight, maxHoldings, isFull, addOptions} = model,
            offTarget = holdings.length && Math.abs(totalWeight - 1) > 1e-9;
        return panel({
            tbar: [
                select({
                    placeholder: isFull ? 'Portfolio is full' : 'Add a symbol...',
                    disabled: isFull,
                    enableFilter: true,
                    options: addOptions,
                    optionRenderer: opt =>
                        hbox({
                            width: '100%',
                            children: [
                                renderTicker(opt.symbol),
                                filler(),
                                span({className: 'xh-text-color-muted', children: opt.name})
                            ]
                        }),
                    value: null,
                    onCommit: symbol => model.addHolding(symbol),
                    flex: 1
                }),
                button({
                    icon: Icon.delete(),
                    tooltip: 'Remove selected',
                    intent: 'danger',
                    disabled: !model.gridModel.hasSelection,
                    onClick: () => model.removeSelected()
                })
            ],
            children: grid({model: model.gridModel}),
            bbar: [
                span(
                    maxHoldings != null
                        ? `${holdings.length} of ${maxHoldings} holdings`
                        : `${holdings.length} holdings`
                ),
                filler(),
                span({
                    className: offTarget ? 'xh-intent-warning' : null,
                    children: `Total ${fmtPercent(totalWeight, {precision: 2})}`
                })
            ]
        });
    }
});

export const portfolioBuilderSpec: WidgetSpec = {
    name: 'toolbox.portfolioBuilder',
    version: 1,
    label: 'Portfolio builder',
    terms: ['portfolio builder', 'hypothetical portfolio', 'basket', 'pick tickers'],
    category: 'input',
    fits: ['content'],
    app: true,
    guidance:
        'An app widget where a user builds a portfolio from tickers and weights. Its value is a ' +
        'portfolio variable. It needs room: give it a layout cell, never a toolbar.',
    config: CONFIG_SCHEMA,
    value: {type: 'toolbox.portfolio'},
    size: {default: {w: 4, h: 8}},
    example: {component: 'toolbox.portfolioBuilder', config: {maxHoldings: 50}},
    exampleBlueprint: {
        variables: {
            portfolio: {
                type: 'toolbox.portfolio',
                label: 'Portfolio',
                setBy: {element: 'toolbox.portfolioBuilder'}
            }
        }
    },
    model: PortfolioBuilderModel,
    component: portfolioBuilder
};
