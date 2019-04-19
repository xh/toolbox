import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {agGrid} from '@xh/hoist/cmp/ag-grid';
import {filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {gridStyleSwitches, wrapper} from '../../common';
import {AgGridViewModel} from './AgGridViewModel';

@HoistComponent
export class AgGridView extends Component {
    model = new AgGridViewModel();

    render() {
        const {model} = this,
            {agGridModel, loadModel, columnDefs} = model;

        return wrapper({
            description: [
                <p>
                    The Hoist <code>agGrid</code> component provides a much more minimal wrapper for
                    ag-Grid, supporting direct use of the library with limited enhancements for
                    consistent Hoist styling, layout support, keyboard navigation, and a backing
                    model for convenient access to the ag-Grid APIs and other utility methods.
                </p>,
                <p>
                    This wrapper does <em>not</em> include a number of Hoist enhancements provided
                    by the core <code>Grid</code> component, including store support, grid state,
                    enhanced column and renderer APIs, absolute value sorting, and enhanced
                    server-side Excel exports. Use of this wrapper is encouraged only when advanced
                    ag-Grid features (such as pivoting) are required.
                </p>
            ],
            item: panel({
                title: 'Grids › ag-Grid Wrapper',
                icon: Icon.gridPanel(),
                flex: 1,
                width: '95%',
                marginBottom: 10,
                mask: loadModel,
                bbar: toolbar(filler(), gridStyleSwitches({gridModel: agGridModel})),
                item: agGrid({
                    key: agGridModel.xhId,
                    model: agGridModel,

                    columnDefs,
                    rowData: [],

                    defaultColDef: {
                        sortable: true,
                        resizable: true,
                        filter: true
                    },

                    sideBar: true,

                    rowSelection: 'single'
                })
            })
        });
    }
}