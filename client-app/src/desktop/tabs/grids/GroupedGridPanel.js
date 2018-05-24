/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel, vframe} from '@xh/hoist/cmp/layout';
import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {baseCol} from '@xh/hoist/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer, millionsRenderer} from '@xh/hoist/format';
import {cloneDeep} from 'lodash';

import {wrapperPanel} from '../impl/WrapperPanel';
import {companyTrades} from '../../../data';

@HoistComponent()
export class GroupedGridPanel extends Component {

    gridModel = new GridModel({
        store: new LocalStore({
            fields: ['id', 'company', 'city', 'trade_volume', 'profit_loss']
        }),
        groupBy: 'city',
        columns: [
            baseCol({
                headerName: 'Company',
                field: 'company'
            }),
            baseCol({
                headerName: 'City',
                field: 'city',
                hide: true
            }),
            baseCol({
                headerName: 'Trade Volume',
                field: 'trade_volume',
                align: 'right',
                cellRenderer: millionsRenderer({precision: 1, label: true})
            }),
            baseCol({
                headerName: 'P&L',
                field: 'profit_loss',
                align: 'right',
                cellRenderer: numberRenderer({precision: 0, ledger: true, colorSpec: true})
            })
        ]
    });

    constructor() {
        super();

        const trades = cloneDeep(companyTrades);
        trades.forEach(it => it.trade_volume = it.trade_volume * 1000000);
        this.gridModel.loadData(trades);
    }

    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-standardgrid-panel',
                title: 'Grouped Grid (City)',
                width: 600,
                height: 400,
                item: this.renderExample()
            })
        );
    }

    renderExample() {
        const model = this.gridModel;
        return vframe({
            cls: 'xh-toolbox-example-container',
            item: grid({
                model,
                gridOptions: {groupDefaultExpanded: 1}
            })
        });
    }


}