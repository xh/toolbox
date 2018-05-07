/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {hoistComponent} from 'hoist/core';
import {vframe} from 'hoist/layout';
import {panel} from 'hoist/cmp';
import {grid, GridModel} from 'hoist/grid';
import {baseCol} from 'hoist/columns/Core';
import {LocalStore} from 'hoist/data';
import {wrapperPanel} from '../impl/WrapperPanel';
import {tradeVolumeFormatter, profitLossFormatter, profitLossColor} from './impl/Formaters';
import {companyTrades} from '../../../data';

@hoistComponent()
export class StandardGridPanel extends Component {

    gridModel = new GridModel({
        store: new LocalStore({
            fields: ['id', 'company', 'city', 'trade_volume', 'profit_loss']
        }),
        columns: [
            baseCol({headerName: 'Company', field: 'company'}),
            baseCol({headerName: 'City', field: 'city'}),
            baseCol({headerName: 'Trade Volume', field: 'trade_volume', cellRenderer: tradeVolumeFormatter}),
            baseCol({headerName: 'P&L', field: 'profit_loss', cellRenderer: profitLossFormatter, cellStyle: profitLossColor})
        ]
    });

    constructor() {
        super();
        this.gridModel.store.loadData(companyTrades);
    }

    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-standardgrid-panel',
                title: 'Standard Grid',
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
            item: grid({model})
        });
    }


}