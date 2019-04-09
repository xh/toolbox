import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {agGrid} from '@xh/hoist/cmp/grid/ag-grid';
import {AgGridViewModel} from './AgGridViewModel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {refreshButton} from '@xh/hoist/desktop/cmp/button';
import {gridStyleSwitches} from '../../common/GridStyleSwitches';
import {filler} from '@xh/hoist/cmp/layout';

@HoistComponent
export class AgGridView extends Component {
    model = new AgGridViewModel();

    render() {
        const {model} = this,
            {agGridModel, loadModel, columnDefs} = model;

        return panel({
            mask: loadModel,
            tbar: toolbar(
                refreshButton({model}),
                toolbarSep()
            ),
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
        });
    }
}