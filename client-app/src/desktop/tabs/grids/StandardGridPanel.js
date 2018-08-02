/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {grid, GridModel, colChooserButton} from '@xh/hoist/desktop/cmp/grid';
import {storeFilterField, storeCountLabel} from '@xh/hoist/desktop/cmp/store';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {baseCol} from '@xh/hoist/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer, millionsRenderer} from '@xh/hoist/format';
import {cloneDeep} from 'lodash';

import {wrapper} from '../impl/Wrapper';
import {companyTrades} from '../../../data';

@HoistComponent()
export class StandardGridPanel extends Component {

    localModel = new GridModel({
        store: new LocalStore({
            fields: ['id', 'company', 'city', 'trade_volume', 'profit_loss']
        }),
        enableColChooser: true,
        selModel: 'multiple',
        columns: [
            baseCol({
                headerName: 'Company',
                field: 'company'
            }),
            baseCol({
                headerName: 'City',
                field: 'city'
            }),
            baseCol({
                headerName: 'Trade Volume',
                field: 'trade_volume',
                align: 'right',
                chooserDescription: 'Total dollar value of all executed trades.',
                cellRenderer: millionsRenderer({precision: 1, label: true})
            }),
            baseCol({
                headerName: 'P&L',
                field: 'profit_loss',
                align: 'right',
                chooserName: 'Profit & Loss',
                chooserDescription: 'The amount of money made ... or lost!',
                cellRenderer: numberRenderer({precision: 0, ledger: true, colorSpec: true})
            })
        ]
    });

    constructor() {
        super();

        const trades = cloneDeep(companyTrades);
        trades.forEach(it => it.trade_volume = it.trade_volume * 1000000);
        this.model.loadData(trades);
    }

    render() {
        const {model} = this,
            store = model.store;

        return wrapper(
            panel({
                cls: 'toolbox-standardgrid-panel',
                title: 'Standard Grid',
                width: 600,
                height: 400,
                item: this.renderExample(),
                icon: Icon.grid(),
                bbar: toolbar(
                    storeCountLabel({
                        store,
                        units: 'companies',
                        flex: 1
                    }),
                    storeFilterField({
                        store,
                        fields: ['company', 'city']
                    }),
                    colChooserButton({gridModel: model})
                )
            })
        );
    }

    renderExample() {
        const model = this.model;
        return vframe({
            cls: 'toolbox-example-container',
            item: grid({model})
        });
    }

}