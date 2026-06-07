import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {agGrid} from '@xh/hoist/cmp/ag-grid';
import {Icon} from '@xh/hoist/icon/Icon';
import {agGridDisplayOptions, wrapper} from '../../common';
import {AgGridViewModel} from './AgGridViewModel';

export const agGridView = hoistCmp.factory({
    model: creates(AgGridViewModel),

    render({model}) {
        const {agGridModel, columnDefs} = model;

        return wrapper({
            title: 'AG Grid Wrapper',
            icon: Icon.gridPanel(),
            description: [
                'The Hoist `agGrid` component provides a much more minimal wrapper for',
                'AG Grid, supporting direct use of the library with limited enhancements for',
                'consistent Hoist styling, layout support, keyboard navigation, and a backing',
                'model for convenient access to the AG Grid APIs and other utility methods.',
                '',
                'This wrapper does *not* include a number of Hoist enhancements provided by',
                'the core `Grid` component, including store support, grid state, enhanced',
                'column and renderer APIs, absolute value sorting, and enhanced server-side',
                'Excel exports. Use of this wrapper is encouraged only when advanced AG Grid',
                'features (such as pivoting) are required.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/AgGridView.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/grid/README.md',
                    text: 'Grid docs',
                    notes: 'Guide to the full-featured Hoist grid.'
                },
                {url: '$HR/cmp/ag-grid/AgGrid.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/ag-grid/AgGridModel.ts',
                    notes: 'Backing model with access to the AG Grid APIs.'
                },
                {
                    url: '$HR/cmp/grid/Grid.ts',
                    notes: 'The full-featured Hoist grid, preferred for most use cases.'
                },
                {
                    url: 'https://www.ag-grid.com/javascript-data-grid/',
                    text: 'AG Grid Docs',
                    notes: 'AG Grid documentation, covering advanced features such as pivoting.'
                }
            ],
            options: [
                ...agGridDisplayOptions(agGridModel),
                button({
                    text: 'Save grid state',
                    icon: Icon.save(),
                    width: '100%',
                    onClick: () =>
                        XH.localStorageService.set('agGridWrapperState', agGridModel.getState())
                }),
                button({
                    text: 'Load grid state',
                    icon: Icon.grid(),
                    width: '100%',
                    onClick: () =>
                        agGridModel.setState(XH.localStorageService.get('agGridWrapperState'))
                })
            ],
            item: panel({
                className: 'tb-grid-wrapper-panel',
                width: '100%',
                mask: 'onLoad',
                item: agGrid({
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
                })
            })
        });
    }
});
