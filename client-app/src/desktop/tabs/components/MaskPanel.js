/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {cloneDeep} from 'lodash';
import {HoistComponent} from '@xh/hoist/core';
import {observable, setter} from '@xh/hoist/mobx';
import {vframe, filler, panel} from '@xh/hoist/cmp/layout';
import {toolbar} from '@xh/hoist/cmp/toolbar';
import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {baseCol} from '@xh/hoist/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer, millionsRenderer} from '@xh/hoist/format';
import {button, inputGroup, label} from '@xh/hoist/kit/blueprint';

import {wrapperPanel} from '../impl/WrapperPanel';
import {companyTrades} from '../../../data';

@HoistComponent()
export class MaskPanel extends Component {

    @observable @setter isDisabled = false;
    @observable @setter seconds = 5;

    localModel = new GridModel({
        store: new LocalStore({
            fields: ['id', 'company', 'city', 'trade_volume', 'profit_loss']
        }),
        emptyText: '',
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

    constructor() {
        super();

        const trades = cloneDeep(companyTrades);
        trades.forEach(it => it.trade_volume = it.trade_volume * 1000000);
        this.model.loadData(trades.reverse());
    }

    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-standardgrid-panel',
                title: 'Mask Component',
                width: 600,
                height: 400,
                item: this.renderExample(),
                bbar: toolbar({
                    alignItems: 'baseline',
                    items: [
                        label('Disable Seconds:'),
                        inputGroup({
                            value: this.seconds,
                            style: {width: '50px'},
                            onChange: this.updateSeconds
                        }),
                        filler(),
                        button({text: 'Disable Panel', onClick: this.disablePanel})
                    ]
                }),
                masked: this.isDisabled
            })
        );
    }

    renderExample() {
        const model = this.model;
        return vframe({
            cls: 'xh-toolbox-example-container',
            item: grid({model})
        });
    }

    updateSeconds = (e) => {
        this.setSeconds(e.target.value);
    }

    disablePanel = () => {
        this.setIsDisabled(true);
        setTimeout(this.enablePanel, this.seconds * 1000);
    }

    enablePanel = () => {
        this.setIsDisabled(false);
    }

}