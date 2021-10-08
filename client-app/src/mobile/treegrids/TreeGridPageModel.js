import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {GroupingChooserModel} from '@xh/hoist/mobile/cmp/grouping';
import {isEmpty} from 'lodash';

export class TreeGridPageModel extends HoistModel {

    @managed
    groupingChooserModel = new GroupingChooserModel({
        dimensions: ['fund', 'model', 'region', 'sector', 'symbol', 'trader'],
        initialValue: ['sector', 'symbol'],
        persistWith: {localStorageKey: 'toolboxTreeGridSample'}
    });

    @managed
    gridModel = new GridModel({
        treeMode: true,
        showSummary: true,
        store: {
            loadRootAsSummary: true
        },
        colChooserModel: true,
        sortBy: 'pnl|desc|abs',
        onRowClicked: ({data: record}) => {
            // Allow single tap on parent row to trigger expand/collapse (default on mobile)
            // without navigating the user away to the detail page.
            if (!isEmpty(record.children)) return;

            const id = encodeURIComponent(record.id);
            XH.appendRoute('treeGridDetail', {id});
        },
        // Used here (and recommended) as an alternate gesture to support drilldown on parent rows
        // when `GridModel.clicksToExpand: 1` (the default). Fires on long-press / tap-and-hold.
        onCellContextMenu: ({data: record}) => {
            const id = encodeURIComponent(record.id);
            XH.appendRoute('treeGridDetail', {id});
        },
        columns: [
            {
                headerName: 'Name',
                field: 'name',
                isTreeColumn: true,
                width: 150
            },
            {
                headerName: 'Mkt Value (m)',
                chooserName: 'Market Value',
                field: 'mktVal',
                align: 'right',
                width: 130,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: millionsRenderer({
                    precision: 3,
                    ledger: true
                })
            },
            {
                headerName: 'P&L',
                field: 'pnl',
                align: 'right',
                width: 120,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: numberRenderer({precision: 0, ledger: true, colorSpec: true})
            }
        ]
    });

    constructor() {
        super();
        this.addReaction({
            track: () => this.groupingChooserModel.value,
            run: () => this.loadAsync()
        });
    }

    async doLoadAsync(loadSpec) {
        const dims = this.groupingChooserModel.value;
        const data = await XH.portfolioService.getPositionsAsync(dims, true);
        this.gridModel.loadData(data);
    }
}
