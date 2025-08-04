import React from 'react';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {agGrid} from '@xh/hoist/cmp/ag-grid';
import {hframe} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';
import {wrapper} from '../../common';
import {AgGridViewModel} from './AgGridViewModel';
import {agGridOptionsPanel} from '../../common/grid/options/AgGridOptionsPanel';

export const agGridView = hoistCmp.factory({
    model: creates(AgGridViewModel),

    render({model}) {
        const {agGridModel, columnDefs} = model;

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
                className: 'tb-grid-wrapper-panel',
                width: '95%',
                mask: 'onLoad',
                item: hframe(
                    agGrid({
                        model: agGridModel,
                        columnDefs,
                        rowData: [],
                        defaultColDef: {
                            sortable: true,
                            resizable: true,
                            filter: true
                        },
                        sideBar: true,
                        rowSelection: {
                            mode: 'singleRow'
                        }
                    }),
                    agGridOptionsPanel({model: agGridModel})
                )
            })
        });
    }
});
