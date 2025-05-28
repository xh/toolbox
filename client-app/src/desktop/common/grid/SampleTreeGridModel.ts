import {createRef} from 'react';
import {flatMapDeep} from 'lodash';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GroupingChooserModel} from '@xh/hoist/desktop/cmp/grouping';
import {fragment} from '@xh/hoist/cmp/layout';
import {checkbox} from '@xh/hoist/desktop/cmp/input';
import {action, makeObservable} from '@xh/hoist/mobx';
import {StoreRecord} from '@xh/hoist/data';
import {mktValCol, nameCol, pnlCol} from '../../../core/columns';
import {PortfolioService} from '../../../core/svc/PortfolioService';

export class SampleTreeGridModel extends HoistModel {
    @managed
    groupingChooserModel = new GroupingChooserModel({
        persistWith: {localStorageKey: 'sampleTreeGrid'},
        dimensions: [
            {name: 'fund'},
            {name: 'region'},
            {name: 'sector'},
            {name: 'symbol'},
            {name: 'trader'}
        ],
        initialValue: ['fund', 'region', 'trader', 'sector', 'symbol'],
        initialFavorites: [
            ['fund', 'region', 'trader', 'sector', 'symbol'],
            ['fund', 'trader', 'sector', 'symbol'],
            ['trader', 'region', 'sector'],
            ['region', 'symbol'],
            ['sector', 'symbol']
        ]
    });

    @managed
    gridModel: GridModel;

    panelRef = createRef<HTMLElement>();

    get store() {
        return this.gridModel.store;
    }

    constructor({includeCheckboxes}) {
        super();
        makeObservable(this);
        this.gridModel = this.createGridModel(includeCheckboxes);

        // Load data when dimensions change
        this.addReaction({
            track: () => this.groupingChooserModel.value,
            run: () => this.loadAsync()
        });

        // Bind dimensions to url parameter
        this.addReaction({
            track: () => XH.routerState,
            run: this.syncDimsToRouter,
            fireImmediately: true
        });

        this.addReaction({
            track: () => this.groupingChooserModel.value,
            run: () => this.syncRouterToDims()
        });
    }

    override async doLoadAsync({isRefresh, isAutoRefresh}) {
        const {gridModel, groupingChooserModel} = this,
            dims = groupingChooserModel.value,
            portfolioService = XH.getService(PortfolioService);
        const data = (await portfolioService?.getPositionsAsync(dims, true)) ?? [];
        if (isRefresh) {
            // Flatten the data. The updateData method ignores child records in a hierarchy,
            // but will update child records in the store if they are updated from a flat array.
            const flattener = rec => [rec, flatMapDeep(rec.children, flattener)],
                flattenedData = flatMapDeep(data, flattener);

            gridModel.updateData({update: flattenedData});
            if (isAutoRefresh) {
                XH.toast({
                    intent: 'primary',
                    message: 'Data Updated',
                    containerRef: this.panelRef.current
                });
            }
        } else {
            gridModel.loadData(data);
        }

        await gridModel.preSelectFirstAsync();
    }

    private syncDimsToRouter() {
        if (!XH.router.isActive('default.grids.tree')) return;

        const {dims} = XH.routerState.params;
        if (!dims) {
            this.syncRouterToDims({replace: true});
        } else {
            this.groupingChooserModel.setValue(dims.split('.'));
        }
    }

    private syncRouterToDims(opts?) {
        if (!XH.router.isActive('default.grids.tree')) return;

        const {groupingChooserModel} = this,
            dims = groupingChooserModel.value.join('.');

        XH.navigate(XH.routerState.name, {dims}, opts);
    }

    private createGridModel(includeCheckboxes) {
        return new GridModel({
            treeMode: true,
            showSummary: 'bottom',
            store: {
                loadRootAsSummary: true,
                fields: [{name: 'isChecked', type: 'bool'}],
                processRawData: r => ({isChecked: false, ...r})
            },
            selModel: {mode: 'multiple'},
            sortBy: 'pnl|desc|abs',
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            levelLabels: () => this.groupingChooserModel.getLevelLabels(),
            columns: [
                {
                    ...nameCol,
                    isTreeColumn: true,
                    ...(includeCheckboxes ? this.createCheckboxTreeColumn() : {})
                },
                {...mktValCol},
                {...pnlCol}
            ]
        });
    }

    //----------------------------------------------
    // CheckBox support
    //----------------------------------------------
    private createCheckboxTreeColumn() {
        return {
            rendererIsComplex: true,
            renderer: (v, {record}) => {
                if (record.isSummary) return record.data.name;
                return fragment(
                    checkbox({
                        displayUnsetState: true,
                        value: record.data.isChecked,
                        onChange: () => this.toggleNode(record)
                    }),
                    record.data.name
                );
            }
        };
    }

    @action
    private toggleNode(rec: StoreRecord) {
        const {store} = this,
            isChecked = !rec.data.isChecked,
            updates = [
                {id: rec.id, isChecked},
                ...rec.allDescendants.map(({id}) => ({id, isChecked}))
            ];

        store.modifyRecords(updates);
        rec.forEachAncestor(it => store.modifyRecords({id: it.id, isChecked: calcAggState(it)}));
    }
}

function calcAggState(rec: StoreRecord) {
    const {allChildren} = rec;
    if (allChildren.every(it => it.data.isChecked === true)) return true;
    if (allChildren.every(it => it.data.isChecked === false)) return false;
    return null;
}
