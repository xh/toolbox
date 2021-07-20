import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GroupingChooserModel} from '@xh/hoist/desktop/cmp/grouping';
import {fragment} from '@xh/hoist/cmp/layout';
import {checkbox} from '@xh/hoist/desktop/cmp/input';
import {fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {action, bindable, makeObservable} from '@xh/hoist/mobx';
import {createRef} from 'react';

export class SampleTreeGridModel extends HoistModel {

    @bindable
    filterIncludesChildren = false;

    @managed
    groupingChooserModel = new GroupingChooserModel({
        persistWith: {localStorageKey: 'sampleTreeGrid'},
        dimensions: ['region', 'sector', {name: 'symbol', isLeafDimension: true}],
        initialValue: ['sector', 'symbol'],
        initialFavorites: [
            ['region', 'sector'],
            ['region', 'symbol'],
            ['sector']
        ]
    });

    @managed
    gridModel;

    panelRef = createRef();

    get store() {return this.gridModel.store}

    constructor({includeCheckboxes}) {
        super();
        makeObservable(this);
        this.gridModel = this.createGridModel(includeCheckboxes);

        this.addReaction({
            track: () => this.filterIncludesChildren,
            run: (val) => this.gridModel.store.setFilterIncludesChildren(val)
        });

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

    async doLoadAsync({isRefresh, isAutoRefresh}) {
        const {gridModel, groupingChooserModel} = this,
            dims = groupingChooserModel.value;

        const data = await XH.portfolioService.getPositionsAsync(dims, true);
        if (isRefresh) {
            gridModel.updateData({update: data});
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

    syncDimsToRouter() {
        if (!XH.router.isActive('default.grids.tree')) return;

        const {dims} = XH.routerState.params;
        if (!dims) {
            this.syncRouterToDims({replace: true});
        } else {
            this.groupingChooserModel.setValue(dims.split('.'));
        }
    }

    syncRouterToDims(opts) {
        if (!XH.router.isActive('default.grids.tree')) return;

        const {groupingChooserModel} = this,
            dims = groupingChooserModel.value.join('.');

        XH.navigate(XH.routerState.name, {dims}, opts);
    }

    createGridModel(includeCheckboxes) {
        return new GridModel({
            treeMode: true,
            store: {
                loadRootAsSummary: true,
                fields: [{name: 'isChecked', type: 'bool'}],
                processRawData: (r) => ({isChecked: false, ...r})
            },
            selModel: {mode: 'multiple'},
            sortBy: 'pnl|desc|abs',
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            sizingMode: XH.appModel.gridSizingMode,
            columns: [
                {
                    headerName: 'Name',
                    width: 200,
                    field: 'name',
                    isTreeColumn: true,
                    ...(includeCheckboxes ? this.createCheckboxTreeColumn() : {})
                },
                {
                    field: 'mktVal',
                    headerName: 'Mkt Value (m)',
                    headerTooltip: 'Market value (in millions USD)',
                    align: 'right',
                    width: 130,
                    absSort: true,
                    agOptions: {
                        aggFunc: 'sum'
                    },
                    tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
                    renderer: millionsRenderer({
                        precision: 3,
                        ledger: true
                    })
                },
                {
                    headerName: 'P&L',
                    field: 'pnl',
                    align: 'right',
                    width: 130,
                    absSort: true,
                    agOptions: {
                        aggFunc: 'sum'
                    },
                    tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
                    renderer: numberRenderer({
                        precision: 0,
                        ledger: true,
                        colorSpec: true
                    })
                }
            ]
        });
    }

    //----------------------------------------------
    // CheckBox support
    //----------------------------------------------
    createCheckboxTreeColumn() {
        return {
            rendererIsComplex: true,
            elementRenderer: (v, {record}) => {
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
    toggleNode(rec) {
        const {store} = this,
            isChecked = !rec.data.isChecked,
            updates = [
                ...rec.allDescendants.map(({id}) => ({id, isChecked}))
            ];

        store.modifyRecords(updates);
        rec.forEachAncestor(it => store.modifyRecords({id: it.id, isChecked: calcAggState(it)}));
    }
}

function calcAggState(rec) {
    const {allChildren} = rec;
    if (allChildren.every(it => it.data.isChecked === true)) return true;
    if (allChildren.every(it => it.data.isChecked === false)) return false;
    return null;
}

