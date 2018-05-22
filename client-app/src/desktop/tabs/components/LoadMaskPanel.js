/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {observable, setter} from '@xh/hoist/mobx';
import {button} from '@xh/hoist/kit/blueprint';
import {cloneDeep} from 'lodash';
import {HoistComponent} from '@xh/hoist/core';
import {wrapperPanel} from '../impl/WrapperPanel';
import {box, filler, panel, vframe} from '@xh/hoist/cmp/layout';
import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {numberField, textField, checkField} from '@xh/hoist/cmp/form';
import {loadMask} from '@xh/hoist/cmp/mask';
import {toolbar, toolbarSep} from '@xh/hoist/cmp/toolbar';
import {baseCol} from '@xh/hoist/columns/Core';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer, millionsRenderer} from '@xh/hoist/format';

import {companyTrades} from '../../../data';

@HoistComponent()
export class LoadMaskPanel extends Component {
    @observable @setter showMask = false;
    @observable @setter seconds = 5;
    @observable @setter maskText = '';
    @observable @setter isViewport = false;

    minSeconds = 1;

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

    get maskingDisabled() {
        return this.showMask || this.seconds < this.minSeconds;
    }

    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-loadmask-panel',
                title: 'LoadMask Component',
                width: 600,
                height: 400,
                item: this.renderExample(),
                bbar: toolbar({
                    items: [
                        box('Show for'),
                        numberField({
                            min: this.minSeconds,
                            width: 50,
                            value: this.seconds,
                            onCommit: this.setSeconds
                        }),
                        box('seconds'),
                        toolbarSep(),
                        box('Text:'),
                        textField({
                            width: 100,
                            value: this.maskText,
                            onCommit: this.setMaskText
                        }),
                        toolbarSep(),
                        checkField({
                            text: 'On viewport',
                            value: this.isViewport,
                            onCommit: (v) => {
                                this.setIsViewport(v);
                            }
                        }),
                        filler(),
                        button({text: 'Load', onClick: this.enableMask, disabled: this.maskingDisabled})
                    ]
                })
            })
        );
    }

    renderExample() {
        const model = this.model;
        return vframe({
            cls: 'xh-toolbox-example-container',
            items: [
                grid({model}),
                loadMask({
                    isDisplayed: this.showMask,
                    text: this.maskText,
                    inline: !this.isViewport
                })
            ]
        });
    }

    enableMask = () => {
        this.setShowMask(true);
        if (!this.isViewport) this.model.loadData([]);

        setTimeout(() => {
            this.finishLoad();
        }, this.seconds * 1000);
    }

    finishLoad() {
        const trades = cloneDeep(companyTrades);
        trades.forEach(it => it.trade_volume = it.trade_volume * 1000000);
        if (!this.isViewport) this.model.loadData(trades.reverse());
        this.setShowMask(false);
    }

}