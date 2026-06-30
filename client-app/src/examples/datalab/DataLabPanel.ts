import {form, formFieldSet} from '@xh/hoist/cmp/form';
import {grid} from '@xh/hoist/cmp/grid';
import {box, div, filler, hbox, hframe, span, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, PlainObject} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {numberInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {DataLabModel} from './DataLabModel';
import './DataLab.scss';

export const dataLabPanel = hoistCmp.factory({
    displayName: 'DataLabPanel',
    className: 'tb-datalab',
    model: creates(DataLabModel),

    render({className}) {
        return panel({
            className,
            item: hframe(controlsPanel(), resultsPanel())
        });
    }
});

// The update stream is described by ORTHOGONAL axes (see UpdateConfig): `updateMode` (incremental
// diff vs full re-snapshot) and `cadence` (steady vs bursty over time), with `batchSize`/`breadth`
// as independent magnitude knobs. Each option's description states how it relates to those knobs.
const UPDATE_MODE_OPTIONS = [
    {
        value: 'incremental',
        label: 'Incremental diff',
        description:
            'Per-row diffs applied via Cube.updateDataAsync. Shaped by the Batch size and Update ' +
            'breadth knobs.'
    },
    {
        value: 'fullReplace',
        label: 'Full replace',
        description:
            'A full re-snapshot each tick (Cube.loadDataAsync), not a diff. Batch size, breadth, ' +
            'and cadence do not apply. Stresses worst-case full-replace cost.'
    }
];

const CADENCE_OPTIONS = [
    {
        value: 'steady',
        label: 'Steady',
        description: 'Constant load - every tick changes Batch size rows at a steady rate.'
    },
    {
        value: 'burst',
        label: 'Burst',
        description:
            'Spiky load - every 5th tick spikes to ~10x Batch size, lighter in between. Batch ' +
            'size is the baseline it scales around. Stresses jank under spikes.'
    }
];

const describedOption = (opt: PlainObject) =>
    div({
        className: 'tb-datalab__pattern-opt',
        items: [
            div({className: 'tb-datalab__pattern-opt-label', item: opt.label}),
            div({className: 'tb-datalab__pattern-opt-desc', item: opt.description})
        ]
    });

//------------------------------------------------------------------------------------------------
// Left: scenario picker + knob editor + run controls
//------------------------------------------------------------------------------------------------
const controlsPanel = hoistCmp.factory<DataLabModel>({
    render({model}) {
        const running = model.taskObserver.isPending,
            {values} = model.scenarioForm,
            // The update-stream knobs apply ONLY to the performance pass - the memory pass loads the
            // snapshot and applies no updates. With performance off, disable them so the UI can't
            // imply they do anything.
            perfOff = !values.measurePerformance,
            // A full re-snapshot ignores batch/breadth/cadence - disable them so the UI can't imply
            // they apply (the original confusion: knobs that silently did nothing).
            fullReplace = values.updateMode === 'fullReplace';
        return panel({
            title: 'Scenario',
            icon: Icon.gears(),
            compactHeader: true,
            modelConfig: {side: 'left', defaultSize: 360, collapsible: true},
            items: [
                form({
                    model: model.scenarioForm,
                    // Stacked (non-inline) layout: label + info note render above each input, giving
                    // both the descriptions and the controls room to breathe in the narrow panel.
                    fieldDefaults: {inline: false},
                    items: [
                        // Measurement passes - each is independent and optional (at least one
                        // required). Memory off skips the 50k per-record sizing churn; performance off
                        // skips warmup + the measured timing loop and disables the Update stream below.
                        formFieldSet({
                            title: 'Measurement passes',
                            icon: Icon.gauge(),
                            items: [
                                formField({
                                    field: 'measureMemory',
                                    info: 'Attribute retained heap by layer (empty baseline + per-record sizing).',
                                    item: switchInput()
                                }),
                                formField({
                                    field: 'measurePerformance',
                                    info: 'Time update flow at steady state (pipeline + grid-sync, median + p95).',
                                    item: switchInput()
                                })
                            ]
                        }),
                        // Dataset shape - loaded as the snapshot by BOTH passes, so always live.
                        formFieldSet({
                            title: 'Dataset shape',
                            icon: Icon.grid(),
                            items: [
                                formField({
                                    field: 'leafRowCount',
                                    info: 'Detail rows loaded before aggregation.',
                                    item: numberInput({width: 140})
                                }),
                                formField({
                                    field: 'dimensionCount',
                                    info: 'Cube grouping levels - sets aggregation depth.',
                                    item: numberInput({width: 140})
                                }),
                                formField({field: 'fieldCount', item: numberInput({width: 140})})
                            ]
                        }),
                        // Update stream - performance pass only. The title notes when the pass is off
                        // and these knobs therefore do nothing.
                        formFieldSet({
                            title: perfOff
                                ? 'Update stream (performance pass off)'
                                : 'Update stream',
                            icon: Icon.bolt(),
                            items: [
                                formField({
                                    field: 'updateMode',
                                    info: 'Incremental per-row diffs vs a full re-snapshot each tick.',
                                    item: select({
                                        enableFilter: false,
                                        options: UPDATE_MODE_OPTIONS,
                                        optionRenderer: describedOption,
                                        disabled: perfOff,
                                        width: 180,
                                        menuWidth: 380
                                    })
                                }),
                                formField({
                                    field: 'cadence',
                                    info: 'Temporal shape of the update stream over time.',
                                    item: select({
                                        enableFilter: false,
                                        options: CADENCE_OPTIONS,
                                        optionRenderer: describedOption,
                                        disabled: perfOff || fullReplace,
                                        width: 180,
                                        menuWidth: 380
                                    })
                                }),
                                formField({
                                    field: 'transport',
                                    info: 'Delivery channel for updates: poll vs push.',
                                    item: select({
                                        enableFilter: false,
                                        options: [
                                            {value: 'http', label: 'HTTP poll'},
                                            {value: 'webSocket', label: 'WebSocket push'}
                                        ],
                                        disabled: perfOff,
                                        width: 180
                                    })
                                }),
                                formField({
                                    field: 'batchSize',
                                    info: 'Records changed per update tick.',
                                    item: numberInput({
                                        width: 140,
                                        disabled: perfOff || fullReplace
                                    })
                                }),
                                formField({
                                    field: 'breadth',
                                    info: 'Fields changed per updated record.',
                                    item: numberInput({
                                        width: 140,
                                        disabled: perfOff || fullReplace
                                    })
                                })
                            ]
                        })
                    ]
                })
            ],
            bbar: toolbar({
                items: [
                    filler(),
                    button({
                        text: running ? 'Running...' : 'Run Scenario',
                        icon: Icon.play(),
                        intent: 'success',
                        disabled: running,
                        onClick: () => model.runAsync()
                    })
                ]
            })
        });
    }
});

//------------------------------------------------------------------------------------------------
// Right: live grid (mounts agApi) + scorecard + comparison
//------------------------------------------------------------------------------------------------
const resultsPanel = hoistCmp.factory<DataLabModel>({
    render({model}) {
        return panel({
            item: vframe(liveGrid(), scorecard(), comparisonPanel()),
            mask: model.taskObserver
        });
    }
});

/**
 * The live data grid bound to `adapter.gridModel`. Mounting it populates `agApi`, which is what
 * makes the harness's bridgeCall (applyTransaction) reflect the real JS-to-AG-Grid crossing rather
 * than call overhead alone (the 02-05 seam requirement).
 */
const liveGrid = hoistCmp.factory<DataLabModel>({
    render({model}) {
        const {gridModel} = model;
        return panel({
            title: 'Live Grid (drives the bridge measurement)',
            icon: Icon.grid(),
            compactHeader: true,
            modelConfig: {side: 'top', defaultSize: 240, collapsible: true},
            item: gridModel
                ? grid({model: gridModel})
                : div({
                      className: 'xh-pad tb-datalab__hint',
                      item: 'Run a scenario to mount the live grid.'
                  })
        });
    }
});

const scorecard = hoistCmp.factory<DataLabModel>({
    render({model}) {
        const {lastResult} = model;
        if (!lastResult) {
            return panel({
                title: 'Scorecard',
                icon: Icon.gauge(),
                compactHeader: true,
                item: div({className: 'xh-pad tb-datalab__hint', item: 'No run yet.'})
            });
        }

        const {scorecard: sc, env, overheadMs} = lastResult,
            // Timings and heap are nullable - a run may have skipped the performance or memory pass.
            // Render each section only when its pass ran; row counts + environment always render.
            {engine, genTxn, bridgeCall, render, heap, rowCounts} = sc;
        return panel({
            title: 'Scorecard',
            icon: Icon.gauge(),
            compactHeader: true,
            // Scrollable so the full scorecard is always reachable - the panel is the flex-middle of
            // the results stack, so a plain `div` (natural height) + panel overflow beats a `vframe`
            // whose rows would flex-shrink and clip when vertical space is tight.
            scrollable: true,
            item: div({
                className: 'xh-pad tb-datalab__scorecard',
                items: [
                    // Timings (performance pass). Engine (cube ingest + connected-View
                    // re-aggregation, Boundaries 1-4) is the PRIMARY data-layer cost - the real engine
                    // work. Surfaced FIRST; the genTransaction build row is the first grid-relay stage.
                    ...(engine && genTxn && bridgeCall && render
                        ? [
                              // Header row doubles as the section title: 'Timings' sits in the metric column.
                              timingRow('Timings', ['Median', 'p95'], true),
                              timingRow('Engine (cube + view)', [
                                  model.fmtMs(engine.medianMs),
                                  model.fmtMs(engine.p95Ms)
                              ]),
                              timingRow('Build txn (genTransaction)', [
                                  model.fmtMs(genTxn.medianMs),
                                  model.fmtMs(genTxn.p95Ms)
                              ]),
                              timingRow('Bridge (applyTransaction)', [
                                  model.fmtMs(bridgeCall.medianMs),
                                  model.fmtMs(bridgeCall.p95Ms)
                              ]),
                              timingRow('Render (deferred frame)', [
                                  model.fmtMs(render.medianMs),
                                  model.fmtMs(render.p95Ms)
                              ])
                          ]
                        : []),
                    // Heap by layer (memory pass).
                    ...(heap
                        ? [
                              sectionLabel('Heap by layer'),
                              kv('Cube store records', model.fmtBytes(heap.cubeStoreRecords)),
                              kv('Grid store records', model.fmtBytes(heap.gridStoreRecords)),
                              kv('View result rows', model.fmtBytes(heap.viewResultRows)),
                              kv('AG Grid remainder', model.fmtBytes(heap.agGridInternals)),
                              kv('Total heap delta', model.fmtBytes(heap.totalHeapDelta))
                          ]
                        : []),
                    sectionLabel('Row counts'),
                    kv(
                        'Leaf / Aggregate / Grid',
                        `${rowCounts.leaf} / ${rowCounts.aggregate} / ${rowCounts.gridRows}`
                    ),
                    sectionLabel('Environment'),
                    kv('Heap method', env.heapMethod),
                    kv('Cross-origin isolated', String(env.crossOriginIsolated)),
                    kv('expose-gc available', String(env.exposeGc)),
                    kv('precise-memory (heuristic)', String(env.preciseMemory)),
                    ...(overheadMs != null
                        ? [kv('Instrumentation overhead', model.fmtMs(overheadMs))]
                        : [])
                ]
            })
        });
    }
});

// One timing row: a metric label followed by N right-aligned value cells. The same helper renders
// the header (isHeader) and each data row, so adding a column (e.g. min/max) is just another value.
const timingRow = (label: string, values: string[], isHeader = false) =>
    hbox({
        className: `tb-datalab__t-row${isHeader ? ' tb-datalab__t-row--header' : ''}`,
        items: [
            box({className: 'tb-datalab__t-metric', item: label}),
            ...values.map(v => box({className: 'tb-datalab__t-val', item: v}))
        ]
    });

const kv = (k: string, v: string) =>
    hbox({className: 'tb-datalab__kv', items: [box({width: 220, item: k}), box({item: v})]});

const sectionLabel = (text: string) => div({className: 'tb-datalab__section', item: text});

//------------------------------------------------------------------------------------------------
// Comparison of two saved runs
//------------------------------------------------------------------------------------------------
const comparisonPanel = hoistCmp.factory<DataLabModel>({
    render({model}) {
        const options = model.savedRuns.map(r => r.label);
        return panel({
            title: 'Compare Saved Runs',
            icon: Icon.balanceScale(),
            compactHeader: true,
            modelConfig: {side: 'bottom', defaultSize: 260, collapsible: true},
            tbar: toolbar({
                compact: true,
                items: [
                    span('Run A'),
                    select({
                        options,
                        enableFilter: false,
                        width: 220,
                        value: model.compareLabels[0] ?? null,
                        onChange: v => (model.compareLabels = [v as string, model.compareLabels[1]])
                    }),
                    toolbarSep(),
                    span('Run B'),
                    select({
                        options,
                        enableFilter: false,
                        width: 220,
                        value: model.compareLabels[1] ?? null,
                        onChange: v => (model.compareLabels = [model.compareLabels[0], v as string])
                    }),
                    filler(),
                    button({
                        text: 'Clear History',
                        icon: Icon.delete(),
                        disabled: !options.length,
                        onClick: () => model.clearSavedRunsAsync()
                    })
                ]
            }),
            item: grid({model: model.comparisonGridModel})
        });
    }
});
