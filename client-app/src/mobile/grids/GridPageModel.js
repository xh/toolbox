import {managed, HoistModel} from '@xh/hoist/core';
import {Grid, GridModel} from '@xh/hoist/cmp/grid';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {LocalStore} from '@xh/hoist/data';
import {multiFieldRenderer} from '@xh/hoist/cmp/grid/renderers';
import {numberRenderer, thousandsRenderer} from '@xh/hoist/format';
import {wait} from '@xh/hoist/promise';

import {companyTrades} from '../../core/data';

@HoistModel
export class GridPageModel {

    @managed
    loadModel = new PendingTaskModel();

    @managed
    gridModel = new GridModel({
        stateModel: 'toolboxSampleGrid',
        sortBy: ['profit_loss|desc|abs'],
        store: new LocalStore({
            fields: ['company', 'city', 'trade_volume', 'profit_loss']
        }),
        columns: [
            {
                field: 'company',
                flex: true,
                renderer: multiFieldRenderer,
                rowHeight: Grid.MULTIFIELD_ROW_HEIGHT,
                multiFieldConfig: {
                    subFields: [{colId: 'city', label: true}]
                }
            },
            {
                headerName: 'P&L',
                field: 'profit_loss',
                width: 120,
                align: 'right',
                absSort: true,
                renderer: multiFieldRenderer,
                rowHeight: Grid.MULTIFIELD_ROW_HEIGHT,
                multiFieldConfig: {
                    mainRenderer: numberRenderer({precision: 0, ledger: true, colorSpec: true}),
                    subFields: [{colId: 'trade_volume', label: true}]
                }
            },
            {
                hidden: true,
                field: 'city'
            },
            {
                hidden: true,
                headerName: 'Volume',
                field: 'trade_volume',
                renderer: thousandsRenderer({precision: 1, label: true})
            }
        ]
    });

    constructor() {
        this.loadAsync();
    }

    loadAsync() {
        return wait(500).then(() => {
            this.gridModel.loadData(companyTrades);
        }).linkTo(
            this.loadModel
        );
    }

}