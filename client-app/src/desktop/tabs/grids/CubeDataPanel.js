import {filler, span} from '@xh/hoist/cmp/layout';
import {fmtNumber} from '@xh/hoist/format';
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {numberInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';
import {grid} from '@xh/hoist/cmp/grid';
import {tooltip} from '@xh/hoist/kit/blueprint';

import {CubeDataModel} from './CubeDataModel';

@HoistComponent
export class CubeDataPanel extends Component {

    model = new CubeDataModel();

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
                    text: 'Reload cube',
                    icon: Icon.gears(),
                    onClick: () => model.loadCube()
                }),
                toolbarSep(),
                switchInput({
                    model,
                    bind: 'tree',
                    label: 'Tree mode',
                    labelAlign: 'left'
                }),
                toolbarSep(),
                filler(),
                span(this.formatRunTimes())
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