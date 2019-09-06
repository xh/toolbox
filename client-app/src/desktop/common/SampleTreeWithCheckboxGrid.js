/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {concat} from 'lodash';

import {emptyFlexCol, grid, gridCountLabel, GridModel} from '@xh/hoist/cmp/grid';
import {filler, fragment} from '@xh/hoist/cmp/layout';
import {
    elemFactory,
    HoistComponent,
    HoistModel,
    LayoutSupport,
    LoadSupport,
    managed,
    XH
} from '@xh/hoist/core';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {dimensionChooser, DimensionChooserModel} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {checkbox} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {fmtNumberTooltip, numberRenderer} from '@xh/hoist/format';
import {Component} from 'react';
import {gridStyleSwitches} from './GridStyleSwitches';
import './SampleTreeWithCheckboxGrid.scss';

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
                gridCountLabel({gridModel}),
                storeFilterField({gridModel}),
                colChooserButton({gridModel}),
                exportButton({gridModel})
            ),
            item: grid({className: 'sample-tree-checkbox-grid', model: gridModel}),
            mask: model.loadModel,
            bbar: toolbar(
                filler(),
                gridStyleSwitches({gridModel, forToolbar: true})
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
            run: () => this.loadAsync(),
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
            .getPositionsAsync(dims)
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
                                const {props} = this,
                                    rowData = props.data,
                                    agApi = props.api;
                                return fragment(
                                    checkbox({
                                        displayUnsetState: true,
                                        value: rowData.enabled === 'indeterminate' ? null : rowData.enabled,
                                        onChange: () => {
                                            const updatedNodes = me.updateFamily(agApi, rowData, me.gridModel.store);
                                            agApi.refreshCells({force: true, columns: ['name'], rowNodes: updatedNodes});
                                        }
                                    }),
                                    rowData.name
                                );
                            }

                            refresh() {return false}
                        }
                }
            }
        };
    }

    updateFamily(agApi, rec, store) {

        rec.enabled = rec.enabled === true ? false : true;
    
        const toggledNode = agApi.getRowNode(rec.id),
            storeRec = store.getById(rec.id);
    
        storeRec.indeterminate = false;
        storeRec.enabled = rec.enabled;
    
        const childNodes = this.setChildren(agApi, storeRec, rec.enabled),
            parentNodes = this.updateAncestors(agApi, storeRec);
        return concat(parentNodes, childNodes, toggledNode);
    }

    setChildren(agApi, storeRec, enabled, updatedNodes) {
        updatedNodes = updatedNodes ? updatedNodes : [];
    
        if (!storeRec.children) return updatedNodes;
    
        storeRec.children.forEach(it => {
            it.indeterminate = false;
            it.enabled = enabled;
    
            const node = agApi.getRowNode(it.id);
            node.setDataValue('enabled', enabled === null ? 'indeterminate' : enabled);
            updatedNodes.push(node);
            this.setChildren(agApi, it, enabled, updatedNodes);
        });
    
        return updatedNodes;
    }

    updateAncestors(agApi, storeRec, updatedNodes) {
        updatedNodes = updatedNodes ? updatedNodes : [];
    
        if (!storeRec.parent) return updatedNodes;
    
        const parent = storeRec.parent,
            isAllEnabled = (rec) => rec.children.every(it => it.enabled && isAllEnabled(it)),
            isAllDisabled = (rec) => rec.children.every(it => !it.enabled && isAllDisabled(it)),
            allEnabled = isAllEnabled(parent),
            allDisabled = isAllDisabled(parent);
    
        parent.enabled = allEnabled ? true : (allDisabled ? false : null);
    
        const node = agApi.getRowNode(parent.id);
        node.setDataValue('enabled', parent.enabled === null ? 'indeterminate' : parent.enabled);
        updatedNodes.push(node);
    
        this.updateAncestors(agApi, storeRec.parent, updatedNodes);
        return updatedNodes;
    }
}


