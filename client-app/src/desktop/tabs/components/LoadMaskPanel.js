/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {observable, setter} from 'hoist/mobx';
import {button, inputGroup, label, checkbox} from 'hoist/kit/blueprint';
import {cloneDeep} from 'lodash';
import {HoistComponent} from 'hoist/core';
import {wrapperPanel} from '../impl/WrapperPanel';
import {panel, vframe} from 'hoist/cmp/layout';
import {grid, GridModel} from 'hoist/cmp/grid';
import {baseCol} from 'hoist/columns/Core';
import {LocalStore} from 'hoist/data';
import {loadMask} from 'hoist/cmp/mask';
import {toolbar} from 'hoist/cmp/toolbar';
import {numberRenderer, millionsRenderer} from 'hoist/format';

import {companyTrades} from '../../../data';

@HoistComponent()
export class LoadMaskPanel extends Component {
    @observable @setter showMask = false;
    @observable @setter seconds = 5;
    @observable @setter maskText = '';
    @observable @setter isViewport = false;

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

    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-loadmask-panel',
                title: 'LoadMask Component',
                width: 600,
                height: 400,
                item: this.renderExample(),
                bbar: toolbar({
                    alignItems: 'baseline',
                    items: [
                        label('Loading Seconds:'),
                        inputGroup({
                            value: this.seconds,
                            style: {width: '50px'},
                            onChange: (value) => this.updateSeconds(value)
                        }),
                        label('Mask Text: '),
                        inputGroup({
                            value: this.maskText,
                            style: {width: '100px'},
                            onChange: (value) => this.updateMaskText(value)
                        }),
                        label('viewport'),
                        checkbox({
                            value: this.isViewport,
                            onChange: (value) => this.updateIsViewport(value)
                        }),
                        button({text: 'Load', onClick: this.enableMask, disabled: this.showMask})
                    ]
                })
            })
        );
    }

    renderExample() {
        const model = this.gridModel;
        return vframe({
            cls: 'xh-toolbox-example-container',
            items: [
                grid({model}),
                loadMask({ isDisplayed: this.showMask, text: this.maskText, inline: !this.isViewport})
            ]
        });
    }

    enableMask = () => {
        this.setShowMask(true);
        if (!this.isViewport) this.gridModel.loadData([]);

        setTimeout(() => {
            const trades = cloneDeep(companyTrades);
            trades.forEach(it => it.trade_volume = it.trade_volume * 1000000);
            if (!this.isViewport) this.gridModel.loadData(trades.reverse());
            this.setShowMask(false);
        }, this.seconds * 1000);
    }

    updateSeconds(e) {
        this.setSeconds(e.target.value);
    }

    updateMaskText(e) {
        this.setMaskText(e.target.value);
    }

    updateIsViewport(e) {
        this.setIsViewport(e.target.checked);
    }
}