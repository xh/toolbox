import {GridModel, TreeStyle} from '@xh/hoist/cmp/grid';
import {fragment} from '@xh/hoist/cmp/layout';
import {HoistModel, managed} from '@xh/hoist/core';
import {StoreRecord} from '@xh/hoist/data';
import {checkbox} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {isEmpty, without} from 'lodash';
import {Company, PeerGroup, Ticker} from './Types';

export class TickerSelectorModel extends HoistModel {
    readonly parentModel: TickerSelectParentModel;

    get selectedTickers(): Ticker[] {
        return this.parentModel.selectedTickers;
    }

    @bindable.ref
    options: TickerSelectOpt[] = [];

    setOptions({
        company,
        peerGroups,
        benchmarks,
        otherCompanies
    }: {
        company: Company;
        peerGroups: PeerGroup[];
        benchmarks: string[];
        otherCompanies: Company[];
    }) {
        const {selectedTickers} = this.parentModel,
            isSel = (ticker: Ticker) => selectedTickers.includes(ticker),
            data: TickerSelectOpt[] = [];

        if (company) {
            data.push({
                type: 'primaryTicker',
                id: company.ticker,
                label: company.ticker,
                ticker: company.ticker,
                selected: isSel(company.ticker),
                selectable: true,
                sortVal: 0
            });
        }

        if (!isEmpty(peerGroups)) {
            data.push({
                id: 'peerHeader',
                type: 'peersHeader',
                label: 'Peer Groups',
                selected: false,
                selectable: false,
                sortVal: 1,
                children: peerGroups.map(pg => ({
                    type: 'peerGroup',
                    id: `peerGroup-${pg.source}`,
                    label: pg.source,
                    selected: pg.peers.every(p => isSel(p.ticker))
                        ? true
                        : pg.peers.every(p => !isSel(p.ticker))
                          ? false
                          : null,
                    selectable: true,
                    tickers: pg.peers.map(p => p.ticker),
                    children: pg.peers.map(p => ({
                        type: 'peer',
                        id: `${pg.source}|${p.ticker}`,
                        ticker: p.ticker,
                        label: p.ticker,
                        selected: isSel(p.ticker),
                        selectable: true
                    }))
                }))
            });
        }

        if (!isEmpty(benchmarks)) {
            data.push({
                id: 'benchmarksHeader',
                type: 'benchmarksHeader',
                label: 'Benchmarks',
                selected: false,
                selectable: false,
                sortVal: 2,
                children: benchmarks.map(ticker => ({
                    type: 'benchmark',
                    id: `benchmark|${ticker}`,
                    ticker,
                    label: ticker,
                    selected: isSel(ticker),
                    selectable: true
                }))
            });
        }

        if (!isEmpty(otherCompanies)) {
            data.push({
                id: 'othersHeader',
                type: 'othersHeader',
                label: 'Other Companies',
                selected: false,
                selectable: false,
                sortVal: 3,
                children: otherCompanies.map(c => ({
                    type: 'other',
                    id: `other|${c.ticker}`,
                    ticker: c.ticker,
                    label: c.ticker,
                    selected: isSel(c.ticker),
                    selectable: true
                }))
            });
        }

        this.gridModel.loadData(data);
    }

    @managed
    gridModel: GridModel;

    constructor({parentModel}: {parentModel: TickerSelectParentModel}) {
        super();
        makeObservable(this);

        this.parentModel = parentModel;
        this.gridModel = this.createGridModel();

        this.addAutorun(() => {
            this.setOptions(parentModel);
        });
    }

    //------------------
    // Implementation
    //------------------
    private createGridModel() {
        return new GridModel({
            treeMode: true,
            expandLevel: 1,
            cellBorders: true,
            hideHeaders: true,
            sizingMode: 'compact',
            treeStyle: TreeStyle.NONE,
            sortBy: 'sortVal',
            store: {
                fields: [
                    {name: 'selectable', type: 'bool'},
                    {name: 'selected', type: 'bool'}
                ]
            },
            columns: [
                {
                    field: {name: 'type', type: 'string'},
                    headerName: '',
                    width: 30,
                    align: 'center',
                    renderer: (v: TickerSelectType) => {
                        if (v === 'primaryTicker') return Icon.circle({prefix: 'fas'});
                        if (v === 'peersHeader') return Icon.users();
                        if (v === 'benchmarksHeader') return Icon.chartLine();
                        if (v === 'othersHeader') return Icon.office();
                        return null;
                    }
                },
                {
                    field: {name: 'label', type: 'string'},
                    headerName: null,
                    isTreeColumn: true,
                    flex: true,
                    rendererIsComplex: true,
                    renderer: (v, {record}) => {
                        if (!record.data.selectable) return record.data.label;
                        return fragment(
                            checkbox({
                                displayUnsetState: true,
                                value: record.data.selected,
                                onChange: () => this.toggleSelection(record)
                            }),
                            record.data.label
                        );
                    }
                },
                {field: 'sortVal', hidden: true}
            ]
        });
    }

    private toggleSelection(rec: StoreRecord) {
        const {parentModel} = this,
            {selectedTickers} = parentModel;

        const opt = rec.raw as TickerSelectOpt;
        const {selectable, selected, ticker, tickers} = opt;
        if (!selectable) return;

        // Direct ticker toggle.
        if (ticker) {
            if (selected) {
                parentModel.setSelectedTickers(without(selectedTickers, ticker));
            } else {
                parentModel.setSelectedTickers([...selectedTickers, ticker]);
            }
            return;
        }

        // Ticker group toggle - all if was none/partial, none if was all
        if (tickers) {
            if (selected) {
                parentModel.setSelectedTickers(without(selectedTickers, ...tickers));
            } else {
                parentModel.setSelectedTickers([...selectedTickers, ...tickers]);
            }
        }
    }
}

interface TickerSelectOpt {
    type: TickerSelectType;
    /** The ticker for child rows, generated pseudo-ticker for synthetic parent rows. */
    id: string;
    ticker?: string;
    tickers?: Ticker[];
    label: string;
    selected: boolean;
    selectable: boolean;
    children?: TickerSelectOpt[];
    sortVal?: number;
}

type TickerSelectType =
    | 'primaryTicker'
    | 'peersHeader'
    | 'peerGroup'
    | 'peer'
    | 'benchmarksHeader'
    | 'benchmark'
    | 'othersHeader'
    | 'other';

type TickerSelectParentModel = HoistModel & {
    selectedTickers: Ticker[];
    setSelectedTickers(tickers: Ticker[]): void;
    company: Company;
    peerGroups: PeerGroup[];
    benchmarks: Ticker[];
    otherCompanies: Company[];
};
