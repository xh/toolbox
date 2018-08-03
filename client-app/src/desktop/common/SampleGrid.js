/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {cloneDeep} from 'lodash';
import {elemFactory, HoistComponent, LayoutSupport} from '@xh/hoist/core';
import {filler} from '@xh/hoist/cmp/layout';
import {grid, GridModel, colChooserButton} from '@xh/hoist/desktop/cmp/grid';
import {storeFilterField, storeCountLabel} from '@xh/hoist/desktop/cmp/store';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {exportButton} from '@xh/hoist/desktop/cmp/button';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {baseCol} from '@xh/hoist/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer, millionsRenderer} from '@xh/hoist/format';
import {companyTrades} from '../../data';

@HoistComponent()
@LayoutSupport
class SampleGrid extends Component {

    localModel = new GridModel({
        store: new LocalStore({
            fields: ['id', 'company', 'city', 'trade_volume', 'profit_loss']
        }),
        emptyText: '',
        enableColChooser: true,
        enableExport: true,
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

    constructor(props) {
        super(props);
        const {model} = this,
            trades = cloneDeep(companyTrades);

        trades.forEach(it => it.trade_volume = it.trade_volume * 1000000);
        model.setGroupBy(this.props.groupBy);
        model.loadData(trades.reverse());
    }

    render() {
        const {model} = this,
            store = model.store;

        return panel({
            cls: this.getClassNames(),
            layoutConfig: this.layoutConfig,
            item: grid({model}),
            bbar: toolbar({
                omit: this.props.omitToolbar,
                items: [
                    storeFilterField({
                        store,
                        fields: ['company', 'city']
                    }),
                    storeCountLabel({
                        store,
                        units: 'companies'
                    }),
                    filler(),
                    colChooserButton({gridModel: model}),
                    exportButton({model, exportType: 'excel'})
                ]
            })
        });
    }
}
export const sampleGrid = elemFactory(SampleGrid);
