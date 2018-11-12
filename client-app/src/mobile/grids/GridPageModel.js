import {XH, HoistModel} from '@xh/hoist/core';
import {Grid, GridModel} from '@xh/hoist/cmp/grid';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {LocalStore} from '@xh/hoist/data';
import {multiFieldRenderer} from '@xh/hoist/cmp/grid/renderers';
import {numberRenderer, thousandsRenderer} from '@xh/hoist/format';

import {companyTrades} from '../../core/data';

@HoistModel
export class GridPageModel {

    loadModel = new PendingTaskModel();

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
                elementRenderer: multiFieldRenderer,
                rowHeight: Grid.MULTIFIELD_ROW_HEIGHT,
                multiFieldRendererCfg: {
                    subFields: [{colId: 'city', label: true}]
                }
            },
            {
                headerName: 'P&L',
                field: 'profit_loss',
                width: 120,
                align: 'right',
                absSort: true,
                elementRenderer: multiFieldRenderer,
                rowHeight: Grid.MULTIFIELD_ROW_HEIGHT,
                multiFieldRendererCfg: {
                    mainRenderer: numberRenderer({precision: 0, ledger: true, colorSpec: true, asElement: true}),
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
                renderer: thousandsRenderer({precision: 1, label: true, asElement: true})
            }
        ]
    });

    constructor() {
        this.gridModel.loadData(companyTrades);
    }

    destroy() {
        XH.safeDestroy(this.gridModel);
        XH.safeDestroy(this.loadModel);
    }

}