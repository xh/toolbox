import {filler, span} from '@xh/hoist/cmp/layout';
import {fmtNumber} from '@xh/hoist/format';
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {numberInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {button, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {grid} from '@xh/hoist/cmp/grid';
import {tooltip} from '@xh/hoist/kit/blueprint';

import {GridTestModel} from './GridTestModel';

@HoistComponent
export class GridTestPanel extends Component {

    model = new GridTestModel();

    render() {
        const {model} = this,
            {gridModel} = model;

        return panel({
            mask: model.loadModel,
            item: gridModel ? grid({
                key: gridModel.xhId,
                model: gridModel,
                renderFlag: model.renderFlag
            }) : null,
            tbar: [
                tooltip({
                    content: 'ID prefix',
                    item: numberInput({
                        model,
                        bind: 'idSeed',
                        width: 40
                    })
                }),
                tooltip({
                    content: '# records to generate',
                    item: numberInput({
                        model,
                        bind: 'recordCount',
                        width: 100
                    })
                }),
                button({
                    text: 'Generate Data',
                    icon: Icon.gears(),
                    onClick: () => model.genTestData()
                }),
                toolbarSep(),
                refreshButton({
                    text: 'Load Grid',
                    model
                }),
                button({
                    text: 'Clear Grid',
                    icon: Icon.delete(),
                    onClick: () => model.clearGrid()
                }),
                button({
                    text: 'Destroy Grid',
                    icon: Icon.skull(),
                    onClick: () => model.tearDown()
                }),
                toolbarSep(),
                tooltip({
                    content: '# records to randomly change',
                    item: numberInput({
                        model,
                        bind: 'twiddleCount',
                        width: 80
                    })
                }),
                button({
                    text: 'Twiddle',
                    icon: Icon.diff(),
                    intent: 'primary',
                    onClick: () => model.twiddleData()
                }),
                filler(),
                span(this.formatRunTimes())
            ],
            bbar: [
                switchInput({
                    model,
                    bind: 'useTransactions',
                    label: 'Use Transactions'
                }),
                switchInput({
                    model,
                    bind: 'useDeltaSort',
                    label: 'Use Delta Sort'
                }),
                switchInput({
                    model,
                    bind: 'tree',
                    label: 'Tree mode'
                }),
                filler(),
                storeFilterField({
                    includeFields: ['symbol', 'trader'],
                    gridModel
                })
            ]
        });
    }

    formatRunTimes() {
        const {model} = this,
            fmt = (v) => v ? fmtNumber(v, {precision: 0, label: 'ms', labelCls: null}) : 'N/A';

        return `Load: ${fmt(model.gridLoadTime)} • Update: ${fmt(model.gridUpdateTime)} `;
    }
}