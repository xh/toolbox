/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent, HoistModel, LayoutSupport, XH, managed, LoadSupport} from '@xh/hoist/core';
import {grid, GridModel, emptyFlexCol} from '@xh/hoist/cmp/grid';
import {filler, fragment} from '@xh/hoist/cmp/layout';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {checkbox} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeCountLabel, storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {numberRenderer, fmtNumberTooltip} from '@xh/hoist/format';
import {DimensionChooserModel, dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';

import './SampleTreeWithCheckboxGrid.scss';
import {gridStyleSwitches} from './GridStyleSwitches';

@HoistComponent
@LayoutSupport
class SampleTreeWithCheckboxGrid extends Component {

    model = new Model();

    render() {
        const {model} = this,
            {gridModel} = model;

        return panel({
            tbar: toolbar(
                refreshButton({model}),
                toolbarSep(),
                dimensionChooser({
                    model: model.dimChooserModel
                }),
                filler(),
                storeCountLabel({gridModel}),
                storeFilterField({gridModel}),
                colChooserButton({gridModel}),
                exportButton({gridModel})
            ),
            item: grid({className: 'sample-tree-checkbox-grid', model: gridModel}),
            mask: model.loadModel,
            bbar: toolbar(
                filler(),
                gridStyleSwitches({gridModel})
            ),
            className: this.getClassName(),
            ...this.getLayoutProps()
        });
    }
}
export const sampleTreeWithCheckboxGrid = elemFactory(SampleTreeWithCheckboxGrid);

@HoistModel
@LoadSupport
class Model {

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
    gridModel = new GridModel({
        treeMode: true,
        store: {
            // Store config fields can be partially specified to fully configure fields as needed,
            // but allow gridModel to populate any missing fields based on its column definitions.
            fields: [{name: 'enabled', type: 'bool', defaultValue: false}]
        },
        sortBy: 'name',
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        compact: XH.appModel.useCompactGrids,
        columns: [
            {
                headerName: 'Name',
                width: 200,
                field: 'name',
                ...this.createCustomTreeColumn()
            },
            {
                headerName: 'P&L',
                field: 'pnl',
                align: 'right',
                width: 130,
                agOptions: {
                    aggFunc: 'sum'
                },
                tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    colorSpec: true
                })
            },
            {...emptyFlexCol}
        ]
    });

    constructor() {
        this.addReaction({
            track: () => this.dimChooserModel.value,
            run: this.loadAsync,
            fireImmediately: true
        });
    }

    //------------------------
    // Implementation
    //------------------------
    async doLoadAsync(loadSpec) {
        const {gridModel, dimChooserModel} = this,
            dims = dimChooserModel.value;

        return XH.portfolioService
            .getPortfolioAsync(dims)
            .then(data => gridModel.loadData(data));
    }


    createCustomTreeColumn() {
        const me = this;
        return {
            isTreeColumn: true,
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
                                return fragment(
                                    checkbox({
                                        displayUnsetState: true,
                                        value: rec.enabled,
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
        rec.enabled = !rec.enabled;
        this.setChildren(rec, rec.enabled);
        this.updateAncestors(rec);
        rec.store.noteDataUpdated();
    }

    setChildren(rec, enabled) {
        // For setting, consult only children currently showing
        rec.children.forEach(r => {
            r.enabled = enabled;
            this.setChildren(r, enabled);
        });
    }

    updateAncestors(rec) {
        const {parent} = rec;
        if (parent) {
            parent.enabled = this.calcAggregateEnabledState(parent);
            this.updateAncestors(parent);
        }
    }

    calcAggregateEnabledState(rec) {
        const states = rec.allChildren.map(r => r.enabled);   // here consult *all* children (even filtered out)
        if (states.every(s => s === true)) return true;
        if (states.every(s => s === false)) return false;
        return null;
    }
}


