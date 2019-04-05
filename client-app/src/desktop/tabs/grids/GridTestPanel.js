import {filler} from '@xh/hoist/cmp/layout';
import {fmtNumber} from '@xh/hoist/format';
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {numberInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {refreshButton, button} from '@xh/hoist/desktop/cmp/button';
import {grid} from '@xh/hoist/cmp/grid';

import {GridTestModel} from './GridTestModel';

@HoistComponent
export class GridTestPanel extends Component {

    model = new GridTestModel();

    render() {
        const {model} = this,
            {gridModel} = model;

        return panel({
            mask: model.loadModel,
            item: gridModel ? grid({key: gridModel.xhId, model: gridModel}) : null,
            tbar: toolbar(
                numberInput({
                    model,
                    bind: 'recordCount',
                    width: 100
                }),
                'records',
                toolbarSep(),
                switchInput({
                    model,
                    bind: 'tree',
                    label: 'Tree mode',
                    labelAlign: 'left'
                }),
                switchInput({
                    model,
                    bind: 'clearData',
                    label: 'Clear data before reload',
                    labelAlign: 'left'
                }),
                toolbarSep(),
                refreshButton({
                    text: 'Load data',
                    model
                }),
                button({
                    text: 'Tear Down',
                    icon: Icon.reset(),
                    onClick: () => model.tearDown()
                }),
                filler(),
                this.formatRunTimes()
            )
        });
    }

    formatRunTimes() {
        const rt = this.model.runTimes,
            fmt = (v) => v ? fmtNumber(v, {precision: 0, label: 'ms', labelCls: null}) : 'N/A';

        return `Clear: ${fmt(rt.clear)} • Gen Data: ${fmt(rt.data)} • Load: ${fmt(rt.load)} `;
    }
}