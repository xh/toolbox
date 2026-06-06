import {creates, elementFactory, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {agGrid} from '@xh/hoist/cmp/ag-grid';
import {hframe, p} from '@xh/hoist/cmp/layout';

const em = elementFactory('em');
import {Icon} from '@xh/hoist/icon/Icon';
import {wrapper} from '../../common';
import {AgGridViewModel} from './AgGridViewModel';
import {agGridOptionsPanel} from '../../common/grid/options/AgGridOptionsPanel';

export const agGridView = hoistCmp.factory({
    model: creates(AgGridViewModel),

    render({model}) {
        const {agGridModel, columnDefs} = model;

        return wrapper({
            title: 'ag-Grid Wrapper',
            icon: Icon.gridPanel(),
            description: [
                p(
                    'The Hoist agGrid component provides a much more minimal wrapper for ag-Grid, supporting direct use of the library with limited enhancements for consistent Hoist styling, layout support, keyboard navigation, and a backing model for convenient access to the ag-Grid APIs and other utility methods.'
                ),
                p(
                    'This wrapper does ',
                    em('not'),
                    ' include a number of Hoist enhancements provided by the core Grid component, including store support, grid state, enhanced column and renderer APIs, absolute value sorting, and enhanced server-side Excel exports. Use of this wrapper is encouraged only when advanced ag-Grid features (such as pivoting) are required.'
                )
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/AgGridView.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/ag-grid/AgGrid.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/ag-grid/AgGridModel.ts',
                    notes: 'Backing model with access to the ag-Grid APIs.'
                },
                {
                    url: '$HR/cmp/grid/Grid.ts',
                    notes: 'The full-featured Hoist grid, preferred for most use cases.'
                }
            ],
            item: panel({
                className: 'tb-grid-wrapper-panel',
                width: '100%',
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
