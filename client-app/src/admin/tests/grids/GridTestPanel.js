import {filler, span} from '@xh/hoist/cmp/layout';
import {fmtNumber} from '@xh/hoist/format';
import {hoistCmp, creates} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {numberInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {button, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {grid} from '@xh/hoist/cmp/grid';
import {tooltip} from '@xh/hoist/kit/blueprint';

import {GridTestModel} from './GridTestModel';


export const GridTestPanel = hoistCmp({

    model: creates(GridTestModel),

    render({model}) {
        const {gridModel} = model;
        
        const formatRunTimes = () => {
            const fmt = (v) => v ? fmtNumber(v, {precision: 0, label: 'ms', labelCls: null}) : 'N/A';
            return `Load: ${fmt(model.gridLoadTime)} • Update: ${fmt(model.gridUpdateTime)} `;
        };

        return panel({
            mask: 'onLoad',
            key: gridModel.xhId,
            item: grid(),
            tbar: [
                tooltip({
                    content: 'ID prefix',
                    item: numberInput({
                        bind: 'idSeed',
                        width: 40
                    })
                }),
                tooltip({
                    content: '# records to generate',
                    item: numberInput({
                        bind: 'recordCount',
                        enableShorthandUnits: true,
                        selectOnFocus: true,
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
                        bind: 'twiddleCount',
                        enableShorthandUnits: true,
                        selectOnFocus: true,
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
                span(formatRunTimes())
            ],
            bbar: [
                switchInput({
                    bind: 'tree',
                    label: 'Tree mode'
                }),
                switchInput({
                    bind: 'useTransactions',
                    label: 'Use Transactions'
                }),
                switchInput({
                    bind: 'useDeltaSort',
                    label: 'Use Delta Sort',
                    disabled: model.tree
                }),
                filler(),
                storeFilterField({
                    includeFields: ['symbol', 'trader']
                })
            ]
        });
    }
});