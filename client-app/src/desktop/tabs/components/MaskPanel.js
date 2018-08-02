/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {cloneDeep} from 'lodash';
import {HoistComponent} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {observable, action, runInAction} from '@xh/hoist/mobx';
import {box, filler} from '@xh/hoist/cmp/layout';
import {numberField, textField} from '@xh/hoist/desktop/cmp/form';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {grid, GridModel} from '@xh/hoist/desktop/cmp/grid';
import {baseCol} from '@xh/hoist/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer, millionsRenderer} from '@xh/hoist/format';
import {button} from '@xh/hoist/desktop/cmp/button';

import {wrapper} from '../impl/Wrapper';
import {companyTrades} from '../../../data';

@HoistComponent()
export class MaskPanel extends Component {

    @observable isMasked = false;
    @observable seconds = 3;
    @observable maskText = '';

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
        const {maskText, isMasked} = this;

        return wrapper({
            description: `
                Masks provide a semi-opaque overlay to disable interaction with a component.
                The most convenient way to display a mask is via the masked property of Panel.
            `,
            item: panel({
                title: 'Components > Mask',
                width: 600,
                height: 400,
                item: grid({
                    model: this.model,
                    flex: 1
                }),
                bbar: toolbar({
                    items: [
                        box('Mask for'),
                        numberField({
                            model: this,
                            field: 'seconds',
                            width: 40,
                            min: 0,
                            max: 10
                        }),
                        box('secs with'),
                        textField({
                            model: this,
                            field: 'maskText',
                            width: 120,
                            placeholder: 'optional text'
                        }),
                        filler(),
                        button({
                            text: 'Show Mask',
                            intent: 'primary',
                            onClick: this.maskPanel
                        })
                    ]
                }),
                maskText: maskText,
                masked: isMasked
            })
        });
    }

    @action
    setSeconds(seconds) {
        this.seconds = seconds;
    }

    @action
    setMaskText(maskText) {
        this.maskText = maskText;
    }

    maskPanel = () => {
        runInAction(() => this.isMasked = true);
        wait(this.seconds * 1000).then(() => this.unmaskPanel());
    }

    unmaskPanel = () => {
        runInAction(() => this.isMasked = false);
    }

}