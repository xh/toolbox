import {filler, span} from '@xh/hoist/cmp/layout';
import {fmtNumber} from '@xh/hoist/format';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {toolbarSep, toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {numberInput, switchInput, select} from '@xh/hoist/desktop/cmp/input';
import {button, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {grid} from '@xh/hoist/cmp/grid';
import {tooltip} from '@xh/hoist/kit/blueprint';
import {GridTestModel} from './GridTestModel';

export const GridTestPanel = hoistCmp({

    model: creates(GridTestModel),

    render({model}) {
        return panel({
            mask: 'onLoad',
            key: model.gridModel.xhId,
            item: grid({
                agOptions: {
                    isRowSelectable: ({data: record}) => !model.disableSelect || record.get('day') > 0
                }
            }),
            tbar: tbar(),
            bbar: bbar()
        });
    }
});

const tbar = hoistCmp.factory(
    ({model}) => new toolbar(
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
        button({
            text: 'Scroll to Selected',
            icon: Icon.crosshairs(),
            onClick: () => model.gridModel.ensureSelectionVisible()
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
        span(formatRunTimes(model))
    )
);

const bbar = hoistCmp.factory(
    ({model}) => toolbar(
        switchInput({
            bind: 'showSummary',
            label: 'Summary Row',
            labelAlign: 'left'
        }),
        toolbarSep(),
        switchInput({
            bind: 'tree',
            label: 'Tree mode',
            labelAlign: 'left'
        }),
        toolbarSep(),
        switchInput({
            bind: 'loadRootAsSummary',
            label: 'Load Root As Summary',
            disabled: !(model.tree && model.showSummary),
            labelAlign: 'left'
        }),
        toolbarSep(),
        switchInput({
            bind: 'useTransactions',
            label: 'Transactions',
            labelAlign: 'left'
        }),
        toolbarSep(),
        tooltip({
            content: 'Autosize Mode',
            item: select({
                bind: 'autosizeMode',
                options: ['disabled', 'onDemand']
            })
        }),
        toolbarSep(),
        switchInput({
            bind: 'useDeltaSort',
            label: 'Delta Sort',
            disabled: model.tree,
            labelAlign: 'left'
        }),
        toolbarSep(),
        switchInput({
            bind: 'disableSelect',
            label: 'Disable Day < 0 Selection',
            labelAlign: 'left'
        }),
        switchInput({
            bind: 'disableSelect',
            label: 'Disable Day < 0 Selection',
            labelAlign: 'left'
        }),
        tooltip({
            content: 'persistWith',
            item: select({
                bind: 'persistType',
                enableClear: true,
                options: [
                    {label: 'Pref', value: 'prefKey'},
                    {label: 'Local Storage', value: 'localStorageKey'},
                    {label: 'Bad Provider', value: 'badKey'}
                ]
            })
        }),
        filler(),
        storeFilterField({
            includeFields: ['symbol', 'trader']
        })
    )
);


function formatRunTimes(model) {
    const fmt = (v) => v ? fmtNumber(v, {precision: 0, label: 'ms', labelCls: null}) : 'N/A',
        {gridLoadTime: lt, avgGridLoadTime: avgLt, gridUpdateTime: ut, avgGridUpdateTime: avgUt} = model;
    return `Load: ${fmt(lt)} ${avgLt ? `(${fmt(avgLt)}) ` : ''}• Update: ${fmt(ut)} ${avgUt ? `(${fmt(avgUt)}) ` : ''}`;
}