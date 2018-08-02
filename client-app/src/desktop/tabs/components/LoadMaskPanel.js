/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {observable, runInAction} from '@xh/hoist/mobx';
import {cloneDeep} from 'lodash';
import {HoistComponent} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {wrapper} from '../impl/Wrapper';
import {box, filler} from '@xh/hoist/cmp/layout';
import {numberField, textField, switchField} from '@xh/hoist/desktop/cmp/form';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {grid, GridModel} from '@xh/hoist/desktop/cmp/grid';
import {loadMask} from '@xh/hoist/desktop/cmp/mask';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {baseCol} from '@xh/hoist/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer, millionsRenderer} from '@xh/hoist/format';

import {companyTrades} from '../../../data';

@HoistComponent()
export class LoadMaskPanel extends Component {
    @observable showMask = false;
    @observable seconds = 3;
    @observable maskText = '';
    @observable maskViewport = false;

    localModel = new GridModel({
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

    render() {
        const {showMask, maskText, maskViewport, seconds} = this;

        return wrapper({
            description: `
                LoadMask adds a spinner to the default mask component. It can also display optional
                text, and can be placed over the entire viewport with inline:false.
            `,
            item: panel({
                title: 'Components > LoadMask',
                width: 600,
                height: 400,
                items: [
                    grid({
                        model: this.model,
                        flex: 1
                    }),
                    loadMask({
                        isDisplayed: showMask,
                        text: maskText,
                        inline: !maskViewport
                    })
                ],
                bbar: toolbar({
                    items: [
                        box('Mask for'),
                        numberField({
                            value: seconds,
                            width: 40,
                            min: 0,
                            max: 10,
                            onChange: this.updateSeconds
                        }),
                        box('secs with'),
                        textField({
                            width: 120,
                            placeholder: 'optional text',
                            value: maskText,
                            onChange: this.updateMaskText
                        }),
                        switchField({
                            value: maskViewport,
                            onChange: this.updateMaskViewport
                        }),
                        box({
                            cls: 'xh-no-pad',
                            item: 'on viewport'
                        }),
                        filler(),
                        button({
                            text: 'Load w/Mask',
                            intent: 'primary',
                            disabled: showMask,
                            onClick: this.enableMask
                        })
                    ]
                })
            })
        });
    }

    enableMask = () => {
        runInAction(() => this.showMask = true);

        if (!this.maskViewport) {
            this.model.loadData([]);
        }

        wait(this.seconds * 1000).then(() => this.finishLoad());
    }

    finishLoad() {
        const trades = cloneDeep(companyTrades);
        trades.forEach(it => it.trade_volume = it.trade_volume * 1000000);
        if (!this.maskViewport) this.model.loadData(trades.reverse());
        runInAction(() => this.showMask = false);
    }

    updateSeconds = (val) => {
        runInAction(() => this.seconds = val);
    }

    updateMaskText = (val) => {
        runInAction(() => this.maskText = val);
    }

    updateMaskViewport = (val) => {
        runInAction(() => this.maskViewport = val);
    }
}