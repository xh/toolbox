import {grid} from '@xh/hoist/cmp/grid';
import {filler, hspacer, label, span, vbox} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button, colChooserButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {numberInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {fmtNumber} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {tooltip} from '@xh/hoist/kit/blueprint';
import {GridTestModel} from './GridTestModel';

export const GridTestPanel = hoistCmp({
    model: creates(GridTestModel),

    render({model}) {
        return vbox({
            flex: 1,
            items: [
                tbar(),
                panel({
                    mask: 'onLoad',
                    item: grid({
                        agOptions: {
                            rowSelection: {
                                mode: 'singleRow',
                                isRowSelectable: ({data: record}) =>
                                    !model.disableSelect || record.get('day') > 0
                            }
                        }
                    })
                }),
                bbar1(),
                bbar2(),
                bbar3()
            ]
        });
    }
});

const tbar = hoistCmp.factory<GridTestModel>(({model}) =>
    toolbar(
        tooltip({
            content: 'Use an incremental numeric id as grid id.',
            item: switchInput({
                bind: 'numericId',
                label: 'Numeric Id',
                labelSide: 'left'
            })
        }),
        tooltip({
            content: 'ID prefix (for non-incremental ids))',
            item: numberInput({
                bind: 'idSeed',
                width: 40,
                disabled: model.numericId
            })
        }),
        tooltip({
            content: '# records to generate',
            item: numberInput({
                bind: 'recordCount',
                enableShorthandUnits: true,
                selectOnFocus: true,
                width: 75
            })
        }),
        button({
            text: 'Generate Data',
            icon: Icon.gears(),
            onClick: () => model.data.generate(model)
        }),
        toolbarSep(),
        refreshButton({
            text: 'Load Grid',
            target: model
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
                width: 75
            })
        }),
        button({
            text: 'Update',
            icon: Icon.diff(),
            intent: 'primary',
            onClick: () => model.twiddleData('update')
        }),
        button({
            text: 'Reload',
            icon: Icon.diff(),
            intent: 'primary',
            onClick: () => model.twiddleData('load')
        }),
        filler(),
        span(formatRunTimes(model))
    )
);

const bbar1 = hoistCmp.factory<GridTestModel>(({model}) =>
    toolbar(
        switchInput({
            bind: 'showSummary',
            label: 'Summary Row',
            labelSide: 'left'
        }),
        toolbarSep(),
        switchInput({
            bind: 'tree',
            label: 'Tree mode',
            labelSide: 'left'
        }),
        toolbarSep(),
        switchInput({
            bind: 'loadRootAsSummary',
            label: 'Load Root As Summary',
            disabled: !(model.tree && model.showSummary),
            labelSide: 'left'
        }),
        toolbarSep(),
        switchInput({
            bind: 'enableXssProtection',
            label: 'Enable XSS',
            labelSide: 'left'
        }),
        toolbarSep(),
        label('Extra Fields'),
        numberInput({
            bind: 'extraFieldCount',
            width: 80
        }),
        toolbarSep(),
        storeFilterField()
    )
);

const bbar2 = hoistCmp.factory<GridTestModel>(({model}) =>
    toolbar(
        label('Persist:'),
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
        hspacer(20),
        label('Selection:'),
        switchInput({
            bind: 'disableSelect',
            label: 'Disable Day < 0 Selection',
            labelSide: 'left'
        }),
        toolbarSep(),
        button({
            text: 'Scroll to Sel',
            icon: Icon.crosshairs(),
            onClick: () => model.gridModel.ensureSelectionVisibleAsync()
        }),
        hspacer(20),
        label('Autosize:'),
        tooltip({
            content: 'Autosize Mode',
            item: select({
                bind: 'autosizeMode',
                options: ['disabled', 'onDemand', 'onSizingModeChanged', 'managed']
            })
        }),
        toolbarSep(),
        switchInput({
            bind: 'renderedRowsOnly',
            label: 'Rendered Rows Only',
            labelSide: 'left'
        }),
        toolbarSep(),
        switchInput({
            bind: 'includeCollapsedChildren',
            label: 'Include Collapsed Children',
            labelSide: 'left'
        })
    )
);

const bbar3 = hoistCmp.factory<GridTestModel>(({model}) =>
    toolbar(
        label('Chooser:'),
        colChooserButton({
            gridModel: model.gridModel
        }),
        toolbarSep(),
        switchInput({
            bind: 'colChooserCommitOnChange',
            label: 'CommitOnChange',
            labelSide: 'left'
        }),
        toolbarSep(),
        switchInput({
            bind: 'colChooserShowRestoreDefaults',
            label: 'ShowRestoreDefaults',
            labelSide: 'left'
        }),
        toolbarSep(),
        label('Width'),
        numberInput({
            bind: 'colChooserWidth',
            width: 60
        }),
        label('Height'),
        numberInput({
            bind: 'colChooserHeight',
            width: 60
        }),
        toolbarSep(),
        switchInput({
            label: 'Lock Column Groups',
            bind: 'lockColumnGroups',
            labelSide: 'left'
        })
    )
);

function formatRunTimes(model) {
    const fmt = v =>
            v ? fmtNumber(v, {precision: 0, label: 'ms', labelCls: null, asHtml: true}) : 'N/A',
        {loadTime: lt, avgLoadTime: avgLt, updateTime: ut, avgUpdateTime: avgUt} = model.metrics;
    return `Load: ${fmt(lt)} ${avgLt ? `(${fmt(avgLt)}) ` : ''}• Update: ${fmt(ut)} ${
        avgUt ? `(${fmt(avgUt)}) ` : ''
    }`;
}
