import {grid} from '@xh/hoist/cmp/grid';
import {filler, placeholder, span, vbox} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp, SelectOption} from '@xh/hoist/core';
import {button, colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {numberInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {viewManager} from '@xh/hoist/desktop/cmp/viewmanager';
import {fmtNumber} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {runInAction} from '@xh/hoist/mobx';
import {wrapper, wrapperAction, wrapperOption, wrapperOptionGroup} from '../../../desktop/common';
import {gridTestBenchmarkDialog} from './GridTestBenchmarkDialog';
import {GridTestModel, VALUE_MIX_OPTIONS} from './GridTestModel';

export const GridTestPanel = hoistCmp({
    model: creates(GridTestModel),

    render({model}) {
        return wrapper({
            title: 'Grid Performance',
            icon: Icon.stopwatch(),
            description: [
                'Stress-test Hoist `Grid` and `Store` with large server-generated datasets.',
                'Configure the shape and volume of the data, toggle the `Store` configs that',
                'trade memory for features, and measure load times and heap cost.',
                '',
                'Options that change how record data objects are *built* prompt for a',
                'full page reload - V8 makes per-page property-storage decisions, so each side',
                'of an A/B must be measured in a fresh page.',
                '',
                'Use Benchmark for repeatable heap and load-time measurements of the current',
                'config.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/admin/tests/grids/GridTestModel.ts',
                    notes: 'This example - model wiring for the options at left.'
                },
                {
                    url: '$TB/grails-app/controllers/io/xh/toolbox/admin/GridTestController.groovy',
                    notes: 'Server-side dataset generation.'
                },
                {
                    url: '$TB/client-app/src/admin/tests/grids/GridTestBenchmarkModel.ts',
                    notes: 'Repeatable heap/timing benchmark harness.'
                },
                {
                    url: '$HR/data/Store.ts',
                    notes: 'Hoist Store - the configs under test.'
                },
                {
                    url: '$HR/data/README.md',
                    text: 'Data package docs',
                    notes: 'Stores, Records, and Fields.'
                }
            ],
            options: [
                viewManager({
                    model: model.viewManagerModel,
                    showSaveButton: 'always',
                    showRevertButton: 'always'
                }),
                datasetOptions(model),
                loadingOptions(model),
                recordDataOptions(model),
                gridOptions(model),
                autosizeOptions(model),
                actions(model)
            ],
            items: [
                panel({
                    width: '100%',
                    height: '100%',
                    mask: model.loadTask,
                    item: model.hasLoadedOnce
                        ? grid({
                              agOptions: {
                                  columnMenu: 'legacy', // support for ag native filtering test
                                  rowSelection: {
                                      mode: 'singleRow',
                                      isRowSelectable: ({data: record}) =>
                                          !model.disableSelect || record.get('day') > 0
                                  }
                              }
                          })
                        : placeholder(
                              Icon.gridLarge(),
                              'Configure a dataset at left, then load to begin testing.',
                              button({
                                  text: 'Load Server Data',
                                  icon: Icon.download(),
                                  intent: 'primary',
                                  minimal: false,
                                  marginTop: 20,
                                  onClick: () => model.loadServerData()
                              })
                          ),
                    tbar: toolbar(
                        button({
                            text: 'Load Server Data',
                            icon: Icon.download(),
                            intent: 'primary',
                            outlined: true,
                            onClick: () => model.loadServerData()
                        }),
                        '-',
                        button({
                            text: 'Update Records',
                            icon: Icon.diff(),
                            onClick: () => model.twiddleData()
                        }),
                        '-',
                        button({
                            text: 'Benchmark',
                            icon: Icon.stopwatch(),
                            onClick: () => model.benchmarkModel.open()
                        })
                    ),
                    bbar: toolbar(
                        storeFilterField(),
                        colChooserButton({gridModel: model.gridModel}),
                        filler(),
                        span(formatRunTimes(model))
                    )
                }),
                gridTestBenchmarkDialog({model: model.benchmarkModel})
            ]
        });
    }
});

/**
 * Option-group builders for the info rail.
 *
 * Disabled states below are navigational hints only - never load-bearing. Options gated by a
 * disabled control retain their customized value (inert, guarded at point of use in
 * GridTestModel / the server) and take effect again when their precondition is restored - they
 * are deliberately not cleared.
 *
 * Where a disabled *switch* would otherwise show a stored value that contradicts the effective
 * behavior (e.g. Stream on-but-disabled reading as "locked on" when streaming is in fact not
 * used), the control displays the effective value via `value`/`onChange` instead of `bind` -
 * the stored preference is untouched and redisplays when its precondition is restored.
 */
const datasetOptions = (model: GridTestModel) =>
    wrapperOptionGroup({
        label: 'Dataset',
        items: [
            wrapperOption({
                label: 'Record count',
                control: numberInput({
                    model,
                    bind: 'recordCount',
                    enableShorthandUnits: true,
                    selectOnFocus: true,
                    width: 90
                })
            }),
            wrapperOption({
                label: 'Rows to update',
                info: 'Recs to change for each Update Records run.',
                control: numberInput({
                    model,
                    bind: 'twiddleCount',
                    enableShorthandUnits: true,
                    selectOnFocus: true,
                    width: 90
                })
            }),
            wrapperOption({
                label: 'Tree data',
                info: 'Hierarchical records, loaded via the JSON endpoint.',
                control: switchInput({model, bind: 'tree'})
            }),
            wrapperOption({
                label: 'Summary row',
                control: switchInput({model, bind: 'showSummary'})
            }),
            wrapperOption({
                label: 'Root as summary',
                propName: 'StoreConfig.loadRootAsSummary',
                info: 'Treat the tree root node as the summary record.',
                control: switchInput({
                    value: model.tree && model.showSummary && model.loadRootAsSummary,
                    onChange: v => runInAction(() => (model.loadRootAsSummary = v)),
                    disabled: !(model.tree && model.showSummary)
                })
            }),
            wrapperOption({
                label: 'Numeric IDs',
                info: 'Use an incremental numeric id for each record.',
                control: switchInput({model, bind: 'numericId'})
            }),
            wrapperOption({
                label: 'ID seed',
                info: 'Prefix for generated ids - change to ensure no id reuse across loads.',
                control: numberInput({
                    model,
                    bind: 'idSeed',
                    width: 60,
                    disabled: model.numericId
                })
            }),
            wrapperOption({
                label: 'Extra fields',
                info: 'Fields declared on the Store beyond the six base fields, to test wide records.',
                control: numberInput({model, bind: 'extraFieldCount', width: 60})
            }),
            wrapperOption({
                label: 'Populate extras',
                info: 'Server fills the extra fields with generated values. Off yields wide but sparse records - fields declared but never populated.',
                control: switchInput({model, bind: 'populateExtraFields'})
            }),
            wrapperOption({
                label: 'Value mix',
                info: 'Every mix populates the same fields, so switching varies value character without moving the populated-field count.',
                control: select({
                    model,
                    bind: 'valueMix',
                    options: [...VALUE_MIX_OPTIONS],
                    optionRenderer: valueMixOption,
                    menuWidth: 280,
                    enableFilter: false,
                    enableClear: false,
                    width: 130,
                    disabled: !model.populateExtraFields
                })
            }),
            wrapperOption({
                label: 'Categories',
                info: 'Cardinality of the categorical string pool - drives how much value sharing is available.',
                control: numberInput({
                    model,
                    bind: 'categoryCount',
                    width: 60,
                    disabled: !model.populateExtraFields || !model.categoryCountApplies
                })
            })
        ]
    });

const loadingOptions = (model: GridTestModel) =>
    wrapperOptionGroup({
        label: 'Loading',
        items: [
            wrapperOption({
                label: 'Stream (NDJSON)',
                info: 'Load incrementally via Store.loadDataAsync(), without buffering the complete raw dataset. Flat data only - off uses the conventional JSON endpoint.',
                control: switchInput({
                    model,
                    value: model.useStreaming,
                    onChange: v => runInAction(() => (model.streamServerLoad = v)),
                    disabled: model.tree || model.showSummary
                })
            }),
            wrapperOption({
                label: 'Intern strings',
                propName: 'FetchOptions.internStrings',
                info: 'Dedupe string values in the response so each distinct value is stored once, shared across rows and successive fetches.',
                control: switchInput({model, bind: 'internStrings'})
            }),
            wrapperOption({
                label: 'XSS protection',
                propName: 'FieldSpec.enableXssProtection',
                info: 'Sanitize string values on parse. Inert under Projection Only, where nothing is parsed.',
                control: switchInput({
                    model,
                    value: model.enableXssProtection && !model.projectionOnly,
                    onChange: v => runInAction(() => (model.enableXssProtection = v)),
                    disabled: model.projectionOnly
                })
            })
        ]
    });

const recordDataOptions = (model: GridTestModel) =>
    wrapperOptionGroup({
        label: 'Record Data',
        items: [
            wrapperOption({
                label: 'Projection only',
                propName: 'StoreConfig.projectionOnly',
                info: 'Read-only projection - each raw object becomes its record data by reference, one object per row instead of two. Toggling reloads the app.',
                control: switchInput({model, bind: 'projectionOnly'})
            }),
            wrapperOption({
                label: 'Dense record threshold',
                propName: 'experimental.denseRecordThreshold',
                info: 'Populated (non-default) field count at/above which a record data object takes its fixed dense shape, vs. the sparse form. Blank = Hoist default. 1 = dense shape for all records; 999 = sparse for all (pre-v87). Inert under Projection Only. Changing reloads the app.',
                control: numberInput({
                    model,
                    bind: 'denseRecordThreshold',
                    width: 60,
                    placeholder: 'default',
                    disabled: model.projectionOnly
                })
            }),
            wrapperOption({
                label: 'Freeze data',
                propName: 'StoreConfig.freezeData',
                info: 'Freeze each record data object (Hoist default on). Toggling reloads the app.',
                control: switchInput({model, bind: 'freezeData'})
            }),
            wrapperOption({
                label: 'Retain raw',
                propName: 'StoreConfig.retainRaw',
                info: model.projectionOnly
                    ? 'Inert under Projection Only - record data is the raw object, so it stays reachable regardless.'
                    : "Off drops each record's reference to its raw data object (Hoist default on), letting it be GC'd after parsing. Required by Reuse Records.",
                // Displays locked-on under Projection Only - genuinely true, not just a UI
                // convention: Store attaches `raw` unconditionally in that mode.
                control: switchInput({
                    value: model.projectionOnly || model.retainRaw,
                    onChange: v => runInAction(() => (model.retainRaw = v)),
                    disabled: model.projectionOnly
                })
            })
        ]
    });

const gridOptions = (model: GridTestModel) =>
    wrapperOptionGroup({
        label: 'Grid',
        items: [
            wrapperOption({
                label: 'Restrict selection',
                info: 'Disallow selecting rows with Day P&L < 0, via agOptions isRowSelectable.',
                control: switchInput({model, bind: 'disableSelect'})
            }),
            wrapperOption({
                label: 'Pin ID column',
                info: 'Pin the id column to the left - exercises the full-width horizontal scrollbar, which spans pinned columns in AG Grid 36.',
                control: switchInput({model, bind: 'pinId'})
            }),
            wrapperOption({
                label: 'Persist state',
                propName: 'GridConfig.persistWith',
                info: '"Bad Provider" tests failure handling.',
                control: select({
                    model,
                    bind: 'persistType',
                    enableClear: true,
                    enableFilter: false,
                    width: 130,
                    options: [
                        {label: 'Pref', value: 'prefKey'},
                        {label: 'Local Storage', value: 'localStorageKey'},
                        {label: 'Bad Provider', value: 'badKey'}
                    ]
                })
            })
        ]
    });

const autosizeOptions = (model: GridTestModel) =>
    wrapperOptionGroup({
        label: 'Autosize',
        items: [
            wrapperOption({
                label: 'Mode',
                propName: 'GridAutosizeOptions.mode',
                control: select({
                    model,
                    bind: 'autosizeMode',
                    options: ['disabled', 'onDemand', 'onSizingModeChanged', 'managed'],
                    enableFilter: false,
                    width: 170
                })
            }),
            wrapperOption({
                label: 'Rendered rows only',
                propName: 'GridAutosizeOptions.renderedRowsOnly',
                control: switchInput({
                    model,
                    bind: 'renderedRowsOnly',
                    disabled: model.autosizeMode === 'disabled'
                })
            }),
            wrapperOption({
                label: 'Include collapsed children',
                propName: 'GridAutosizeOptions.includeCollapsedChildren',
                control: switchInput({
                    model,
                    bind: 'includeCollapsedChildren',
                    disabled: model.autosizeMode === 'disabled'
                })
            }),
            wrapperOption({
                label: 'Include hidden columns',
                propName: 'GridAutosizeOptions.includeHiddenColumns',
                control: switchInput({
                    model,
                    bind: 'includeHiddenColumns',
                    disabled: model.autosizeMode === 'disabled'
                })
            })
        ]
    });

const actions = (model: GridTestModel) =>
    wrapperOptionGroup({
        label: 'Actions',
        items: [
            wrapperAction({
                text: 'Scroll to Selection',
                icon: Icon.crosshairs(),
                onClick: () => model.gridModel.ensureSelectionVisibleAsync()
            }),
            wrapperAction({
                text: 'Clear Grid',
                icon: Icon.delete(),
                intent: 'danger',
                onClick: () => model.clearGrid()
            }),
            wrapperAction({
                text: 'Destroy Grid',
                icon: Icon.skull(),
                intent: 'danger',
                onClick: () => model.tearDown()
            })
        ]
    });

/** Two-line dropdown option for the Value Mix select - label over a short value-character note. */
function valueMixOption(opt: SelectOption) {
    return vbox(
        span(opt.label),
        span({
            item: (opt as any).desc,
            style: {fontSize: '0.85em', color: 'var(--xh-text-color-muted)', whiteSpace: 'normal'}
        })
    );
}

function formatRunTimes(model: GridTestModel) {
    const fmt = v =>
            v ? fmtNumber(v, {precision: 0, label: 'ms', labelCls: null, asHtml: true}) : 'N/A',
        {loadTime: lt, avgLoadTime: avgLt, updateTime: ut, avgUpdateTime: avgUt} = model.metrics;
    return `Load: ${fmt(lt)} ${avgLt ? `(${fmt(avgLt)}) ` : ''}• Update: ${fmt(ut)} ${
        avgUt ? `(${fmt(avgUt)}) ` : ''
    }`;
}
