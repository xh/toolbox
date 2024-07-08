import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {GroupingChooserModel} from '@xh/hoist/mobile/cmp/grouping';
import {isEmpty} from 'lodash';
import {mktValCol, nameCol, pnlCol} from '../../../core/columns';

export class TreeGridPageModel extends HoistModel {
    @managed
    groupingChooserModel: GroupingChooserModel = new GroupingChooserModel({
        dimensions: ['fund', 'model', 'region', 'sector', 'symbol', 'trader'],
        initialValue: ['sector', 'symbol'],
        persistWith: {localStorageKey: 'toolboxTreeGridSample'}
    });

    @managed
    gridModel: GridModel = new GridModel({
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
                ...nameCol,
                isTreeColumn: true,
                width: 150
            },
            {...mktValCol},
            {...pnlCol}
        ]
    });

    constructor() {
        super();
        this.addReaction({
            track: () => this.groupingChooserModel.value,
            run: () => this.loadAsync()
        });
    }

    override async doLoadAsync(loadSpec) {
        const dims = this.groupingChooserModel.value;
        const data = await XH.portfolioService.getPositionsAsync(dims, true);
        this.gridModel.loadData(data);
    }
}
