import {filler} from '@xh/hoist/cmp/layout';
import {fmtNumber} from '@xh/hoist/format';
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {numberInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {refreshButton, button} from '@xh/hoist/desktop/cmp/button';
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
            tbar: toolbar(
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
                    text: 'Generate',
                    icon: Icon.gears(),
                    onClick: () => model.genTestData()
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
                    onClick: () => model.twiddleData()
                }),
                toolbarSep(),
                switchInput({
                    model,
                    bind: 'tree',
                    label: 'Tree mode',
                    labelAlign: 'left'
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
                    text: 'Tear Down',
                    icon: Icon.skull(),
                    onClick: () => model.tearDown()
                }),
                filler(),
                this.formatRunTimes()
            ),
            bbar: toolbar([
                storeFilterField({
                    includeFields: ['symbol', 'trader'],
                    gridModel
                })
            ])
        });
    }

    formatRunTimes() {
        const rt = this.model.runTimes,
            fmt = (v) => v ? fmtNumber(v, {precision: 0, label: 'ms', labelCls: null}) : 'N/A';

        return `Gen Data: ${fmt(rt.data)} • Load: ${fmt(rt.load)} `;
    }
}