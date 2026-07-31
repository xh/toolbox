import {grid} from '@xh/hoist/cmp/grid';
import {filler, hspacer, label, span, vbox} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button, colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {numberInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {viewManager} from '@xh/hoist/desktop/cmp/viewmanager';
import {fmtNumber} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {tooltip} from '@xh/hoist/kit/blueprint';
import {gridTestBenchmarkDialog} from './GridTestBenchmarkDialog';
import {GridTestModel, VALUE_MIX_OPTIONS} from './GridTestModel';

export const GridTestPanel = hoistCmp({
    model: creates(GridTestModel),

    render({model}) {
        return vbox({
            flex: 1,
            items: [
                tbar(),
                panel({
                    mask: model.loadTask,
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
                storeFlagsBar(),
                bbar2(),
                bbar3(),
                gridTestBenchmarkDialog({model: model.benchmarkModel})
            ]
        });
    }
});

const tbar = hoistCmp.factory<GridTestModel>(({model}) =>
    toolbar(
        // Save/restore all of the testing parameters below as named configs - see GridTestModel.
        viewManager({
            model: model.viewManagerModel,
            showSaveButton: 'always',
            showRevertButton: 'always'
        }),
        toolbarSep(),
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
            content: '# records to load',
            item: numberInput({
                bind: 'recordCount',
                enableShorthandUnits: true,
                selectOnFocus: true,
                width: 75
            })
        }),
        toolbarSep(),
        tooltip({
            content: 'Load test data from the server.',
            item: button({
                text: 'Load Server Data',
                icon: Icon.download(),
                intent: 'primary',
                onClick: () => model.loadServerData()
            })
        }),
        tooltip({
            content:
                'On to load from the streaming NDJSON endpoint via Store.loadDataAsync() - ' +
                'off to load from the conventional JSON endpoint via loadData(). Streaming ' +
                'supports flat data only - disabled when tree/summary enabled.',
            item: switchInput({
                bind: 'streamServerLoad',
                label: 'Stream',
                labelSide: 'left',
                disabled: model.tree || model.showSummary
            })
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
            onClick: () => model.twiddleData()
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
        tooltip({
            content: '# of extra fields to declare on the store, beyond the six base fields.',
            item: numberInput({
                bind: 'extraFieldCount',
                width: 80
            })
        }),
        tooltip({
            content:
                'Have the server populate the extra fields with generated values, per the Value ' +
                'Mix below. Off yields wide but sparse records, with the extra fields declared ' +
                'but never populated.',
            item: switchInput({
                bind: 'populateExtraFields',
                label: 'Populate',
                labelSide: 'left'
            })
        }),
        toolbarSep(),
        label('Value Mix'),
        tooltip({
            content:
                'Value distribution the server generates for the populated extra fields. Every mix ' +
                'populates the same ~11/12 of them, so switching mixes varies value character ' +
                'without moving the populated-field count. Takes effect on the next load - no page ' +
                'reload needed, as the record shape is identical across mixes.',
            item: select({
                bind: 'valueMix',
                options: [...VALUE_MIX_OPTIONS],
                enableFilter: false,
                enableClear: false,
                width: 140,
                disabled: !model.populateExtraFields
            })
        }),
        tooltip({
            content: model.categoryCountApplies
                ? 'Cardinality of the categorical string pool - how many distinct values the ' +
                  'categorical columns draw from. Names are fixed-width, so this varies pool size ' +
                  'without also varying value byte size. Drives how much sharing is available to ' +
                  'Intern Strings.'
                : 'Inert for this Value Mix - it generates no categorical values.',
            item: numberInput({
                bind: 'categoryCount',
                width: 90,
                disabled: !model.populateExtraFields || !model.categoryCountApplies
            })
        }),
        toolbarSep(),
        storeFilterField()
    )
);

/**
 * Store/fetch flags that drive the memory + load-time profile of the data under test. Note the
 * first two require a fresh page when toggled - see GridTestModel for why.
 */
const storeFlagsBar = hoistCmp.factory<GridTestModel>(({model}) =>
    toolbar(
        label('Store:'),
        tooltip({
            content:
                'Store.useRawAsData - each raw object becomes its record data by reference, so a row costs one object rather than two. No parsing, so Field types and XSS protection do not apply. Mutually exclusive with Reuse Records. Toggling reloads the app.',
            item: switchInput({
                bind: 'useRawAsData',
                label: 'Use Raw As Data',
                labelSide: 'left'
            })
        }),
        toolbarSep(),
        tooltip({
            content:
                'Store.freezeData - freezes each record data object (Hoist default on). Changes how record data is built and stored, so toggling reloads the app.',
            item: switchInput({
                bind: 'freezeData',
                label: 'Freeze Data',
                labelSide: 'left'
            })
        }),
        toolbarSep(),
        tooltip({
            content: model.useRawAsData
                ? 'Inert under Use Raw As Data - record data *is* the raw object, so it stays reachable whatever this is set to, and no memory can be released by dropping the reference.'
                : 'Store.retainRaw - off drops the reference each record holds to its raw data object (Hoist default on), letting that raw data be collected. Required by Reuse Records.',
            item: switchInput({
                bind: 'retainRaw',
                label: 'Retain Raw',
                labelSide: 'left'
            })
        }),
        toolbarSep(),
        tooltip({
            content: model.useRawAsData
                ? 'Mutually exclusive with Use Raw As Data - Store throws if given both.'
                : model.retainRaw
                  ? 'Store.reuseRecords - reuses records whose raw data object is reference-identical to the previously loaded one (Hoist default off). Does nothing on a first load: use the "Reload (same raw refs)" benchmark scenario to see it hit.'
                  : 'Requires Retain Raw - record reuse matches on the retained raw reference.',
            item: switchInput({
                bind: 'reuseRecords',
                label: 'Reuse Records',
                labelSide: 'left',
                disabled: !model.retainRaw || model.useRawAsData
            })
        }),
        toolbarSep(),
        tooltip({
            content:
                'FetchOptions.internStrings (a fetch config, not a StoreConfig) - dedupes string values in the response so each distinct value is stored once, sharing values across successive fetches of the same key. Use the reload benchmark scenarios to see the cross-fetch effect.',
            item: switchInput({
                bind: 'internStrings',
                label: 'Intern Strings',
                labelSide: 'left'
            })
        }),
        filler(),
        tooltip({
            content:
                'Run repeatable heap + load-time measurements against the flags as currently configured.',
            item: button({
                text: 'Benchmark',
                icon: Icon.stopwatch(),
                intent: 'success',
                outlined: true,
                onClick: () => model.benchmarkModel.open()
            })
        })
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
        }),
        toolbarSep(),
        switchInput({
            bind: 'includeHiddenColumns',
            label: 'Include Hidden Cols',
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
