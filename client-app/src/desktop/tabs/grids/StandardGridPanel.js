/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from 'hoist/core';
import {panel} from 'hoist/cmp/layout';
import {grid, GridModel, colChooserButton} from 'hoist/cmp/grid';
import {storeFilterField, storeCountLabel} from 'hoist/cmp/store';
import {toolbar} from 'hoist/cmp/toolbar';
import {Icon} from 'hoist/icon';
import {baseCol} from 'hoist/columns/Core';
import {LocalStore} from 'hoist/data';
import {numberRenderer, millionsRenderer} from 'hoist/format';
import {cloneDeep} from 'lodash';

import {wrapperPanel} from '../impl/WrapperPanel';
import {companyTrades} from '../../../data';

@HoistComponent()
export class StandardGridPanel extends Component {

    localModel = new GridModel({
        store: new LocalStore({
            fields: ['id', 'company', 'city', 'trade_volume', 'profit_loss']
        }),
        enableColChooser: true,
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
                description: 'Total dollar value of all executed trades.',
                cellRenderer: millionsRenderer({precision: 1, label: true})
            }),
            baseCol({
                headerName: 'P&L',
                field: 'profit_loss',
                align: 'right',
                description: 'The amount of money made or lost!',
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

        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-standardgrid-panel xh-toolbox-example-container',
                title: 'Standard Grid',
                icon: Icon.grid(),
                width: 600,
                height: 400,
                item: grid({model}),
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

}