/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {cloneDeep} from 'lodash';
import {XH, HoistComponent} from 'hoist/core';
import {action, observable} from 'hoist/mobx';
import {vframe, filler, panel} from 'hoist/cmp/layout';
import {toolbar} from 'hoist/cmp/toolbar';
import {grid, GridModel} from 'hoist/cmp/grid';
import {baseCol} from 'hoist/columns/Core';
import {LocalStore} from 'hoist/data';
import {numberRenderer, millionsRenderer} from 'hoist/format';
import {button, inputGroup, label} from 'hoist/kit/blueprint';

import {wrapperPanel} from '../impl/WrapperPanel';
import {companyTrades} from '../../../data';

@HoistComponent()
export class MaskPanel extends Component {

    @observable isDisabled = false;
    @observable seconds = 2;

    gridModel = new GridModel({
        store: new LocalStore({
            fields: ['id', 'company', 'city', 'trade_volume', 'profit_loss']
        }),
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
        this.gridModel.loadData(trades.reverse());
    }

    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-standardgrid-panel',
                title: 'Mask Panel',
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
                            onChange: (value) => this.updateSeconds(value)
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
        const model = this.gridModel;
        return vframe({
            cls: 'xh-toolbox-example-container',
            item: grid({model})
        });
    }

    @action
    updateSeconds(e) {
        this.seconds = e.target.value;
    }

    @action
    disablePanel = () => {
        this.isDisabled = true;
        setTimeout(this.enablePanel, this.seconds * 1000);
    }

    @action
    enablePanel = () => {
        this.isDisabled = false;
    }

    destroy() {
        XH.safeDestroy(this.gridModel);
    }

}