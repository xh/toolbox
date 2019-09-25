/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {DimensionChooserModel} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {fragment} from '@xh/hoist/cmp/layout';
import {checkbox} from '@xh/hoist/desktop/cmp/input';
import {fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {bindable} from '@xh/hoist/mobx';
import {Component} from 'react';

@HoistModel
@LoadSupport
export class SampleTreeGridModel {

    @bindable
    filterIncludeChildren = false;
    
    @managed
    dimChooserModel = new DimensionChooserModel({
        dimensions: [
            {value: 'region', label: 'Region'},
            {value: 'sector', label: 'Sector'},
            {value: 'symbol', label: 'Symbol'}
        ],
        initialValue: ['sector', 'symbol']
    });

    @managed
    gridModel;

    constructor({includeCheckboxes}) {
        this.gridModel = this.createGridModel(includeCheckboxes);

        // Load data when dimensions change
        this.addReaction({
            track: () => this.dimChooserModel.value,
            run: () => this.loadAsync()
        });

        // Bind dimensions to url parameter
        this.addReaction({
            track: () => XH.routerState,
            run: this.syncDimsToRouter,
            fireImmediately: true
        });

        this.addReaction({
            track: () => this.dimChooserModel.value,
            run: () => this.syncRouterToDims()
        });
    }

    async doLoadAsync(loadSpec) {
        const {gridModel, dimChooserModel} = this,
            dims = dimChooserModel.value;

        return XH.portfolioService
            .getPositionsAsync(dims, true)
            .then(data => {
                gridModel.loadData(data);
                gridModel.selectFirst();
            });
    }

    syncDimsToRouter() {
        if (!XH.router.isActive('default.grids.tree')) return;

        const {dims} = XH.routerState.params;
        if (!dims) {
            this.syncRouterToDims({replace: true});
        } else {
            this.dimChooserModel.setValue(dims.split('.'));
        }
    }

    syncRouterToDims(opts) {
        if (!XH.router.isActive('default.grids.tree')) return;

        const {dimChooserModel} = this,
            dims = dimChooserModel.value.join('.');

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
            enableColChooser: true,
            enableExport: true,
            compact: XH.appModel.useCompactGrids,
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
        const me = this;
        return {
            rendererIsComplex: true,
            agOptions: {
                cellRendererParams: {
                    suppressCount: true,
                    innerRendererFramework:
                        class extends Component {
                            constructor(props) {
                                super(props);
                                props.reactContainer.style = 'display: inline-block';
                            }

                            render() {
                                const rec = this.props.data;
                                if (rec.xhIsSummary) return rec.name;
                                return fragment(
                                    checkbox({
                                        displayUnsetState: true,
                                        value: rec.isChecked,
                                        onChange: () => me.toggleNode(rec)
                                    }),
                                    rec.name
                                );
                            }

                            refresh() {return false}
                        }
                }
            }
        };
    }

    toggleNode(rec) {
        const updates = [];
        this.setNode(rec, !rec.isChecked, updates);
        this.setChildren(rec, !rec.isChecked, updates);
        rec.store.updateData({update: updates});
        this.updateAncestors(rec);
    }

    setNode(rec, isChecked, bulkUpdate) {
        const update = {id: rec.id, ...rec.raw, isChecked};
        if (bulkUpdate) {
            bulkUpdate.push(update);
        } else {
            rec.store.updateData({update: [update]});
        }
    }

    setChildren(rec, isChecked, updates) {
        // For setting, consult only children currently showing
        rec.children.forEach(r => {
            this.setNode(r, isChecked, updates);
            this.setChildren(r, isChecked, updates);
        });
    }

    updateAncestors(rec) {
        const {parent} = rec;
        if (parent) {
            this.setNode(parent, this.calcAggregateState(parent));
            this.updateAncestors(parent);
        }
    }

    calcAggregateState(rec) {
        const states = rec.allChildren.map(r => r.isChecked);   // here consult *all* children (even filtered out)
        if (states.every(s => s === true)) return true;
        if (states.every(s => s === false)) return false;
        return null;
    }

}

