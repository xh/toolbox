import {grid} from '@xh/hoist/cmp/grid';
import {box, div, filler, hbox, hframe, span, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
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

//------------------------------------------------------------------------------------------------
// Left: scenario picker + knob editor + run controls
//------------------------------------------------------------------------------------------------
const controlsPanel = hoistCmp.factory<DataLabModel>({
    render({model}) {
        const {scenario, running} = model;
        return panel({
            title: 'Scenario',
            icon: Icon.gears(),
            compactHeader: true,
            modelConfig: {side: 'left', defaultSize: 360, collapsible: true},
            items: [
                vframe({
                    className: 'xh-pad',
                    items: [
                        knob('Leaf rows', numberInput({bind: 'leafRowCount', model, width: 140})),
                        knob(
                            'Dimensions',
                            numberInput({bind: 'dimensionCount', model, width: 140})
                        ),
                        knob(
                            'Fields',
                            numberInput({
                                value: scenario.dataset.fieldCount,
                                onChange: v => model.updateDataset({fieldCount: v as number}),
                                width: 140
                            })
                        ),
                        knob(
                            'Update pattern',
                            select({
                                bind: 'pattern',
                                model,
                                enableFilter: false,
                                options: [
                                    'steadyTrickle',
                                    'periodicBurst',
                                    'broadReplace',
                                    'targetedNarrow'
                                ],
                                width: 180
                            })
                        ),
                        knob(
                            'Transport',
                            select({
                                bind: 'transport',
                                model,
                                enableFilter: false,
                                options: [
                                    {value: 'http', label: 'HTTP poll'},
                                    {value: 'webSocket', label: 'WebSocket push'}
                                ],
                                width: 180
                            })
                        ),
                        knob(
                            'Batch size',
                            numberInput({
                                value: scenario.update.batchSize,
                                onChange: v => model.updateUpdateCfg({batchSize: v as number}),
                                width: 140
                            })
                        ),
                        knob(
                            'Update breadth',
                            numberInput({
                                value: scenario.update.breadth,
                                onChange: v => model.updateUpdateCfg({breadth: v as number}),
                                width: 140
                            })
                        )
                    ]
                })
            ],
            bbar: toolbar({
                compact: true,
                items: [
                    button({
                        text: 'Save Profile',
                        icon: Icon.add(),
                        onClick: () => promptSaveScenario(model)
                    }),
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

const knob = (label: string, input) =>
    hbox({
        className: 'tb-datalab__knob',
        alignItems: 'center',
        items: [box({width: 130, item: label}), filler(), input]
    });

function promptSaveScenario(model: DataLabModel) {
    XH.prompt<string>({
        title: 'Save Scenario Profile',
        message: 'Name this scenario profile:',
        input: {initialValue: model.scenario.name}
    }).then(name => {
        if (name) model.saveScenarioAsAsync(name);
    });
}

//------------------------------------------------------------------------------------------------
// Right: live grid (mounts agApi) + scorecard + comparison
//------------------------------------------------------------------------------------------------
const resultsPanel = hoistCmp.factory<DataLabModel>({
    render({model}) {
        return panel({
            item: vframe(liveGrid(), scorecard(), comparisonPanel()),
            mask: model.running
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
            modelConfig: {defaultSize: 240, collapsible: true},
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

        const {scorecard: sc, env, overheadMs} = lastResult;
        return panel({
            title: 'Scorecard',
            icon: Icon.gauge(),
            compactHeader: true,
            item: vframe({
                className: 'xh-pad tb-datalab__scorecard',
                items: [
                    statRow(
                        'Compute (genTransaction)',
                        model.fmtMs(sc.compute.medianMs),
                        model.fmtMs(sc.compute.p95Ms)
                    ),
                    statRow(
                        'Bridge (applyTransaction)',
                        model.fmtMs(sc.bridgeCall.medianMs),
                        model.fmtMs(sc.bridgeCall.p95Ms)
                    ),
                    statRow(
                        'Render (deferred frame)',
                        model.fmtMs(sc.render.medianMs),
                        model.fmtMs(sc.render.p95Ms)
                    ),
                    sectionLabel('Heap by layer'),
                    kv('Cube store records', model.fmtBytes(sc.heap.cubeStoreRecords)),
                    kv('Grid store records', model.fmtBytes(sc.heap.gridStoreRecords)),
                    kv('View result rows', model.fmtBytes(sc.heap.viewResultRows)),
                    kv('AG Grid remainder', model.fmtBytes(sc.heap.agGridInternals)),
                    kv('Total heap delta', model.fmtBytes(sc.heap.totalHeapDelta)),
                    sectionLabel('Row counts'),
                    kv(
                        'Leaf / Aggregate / Grid',
                        `${sc.rowCounts.leaf} / ${sc.rowCounts.aggregate} / ${sc.rowCounts.gridRows}`
                    ),
                    sectionLabel('Environment'),
                    kv('Heap method', env.heapMethod),
                    kv('Cross-origin isolated', String(env.crossOriginIsolated)),
                    kv('expose-gc available', String(env.exposeGc)),
                    kv('precise-memory (heuristic)', String(env.preciseMemory)),
                    kv('Instrumentation overhead', model.fmtMs(overheadMs))
                ]
            })
        });
    }
});

const statRow = (label: string, median: string, p95: string) =>
    hbox({
        className: 'tb-datalab__stat',
        items: [
            box({width: 220, item: span({className: 'tb-datalab__stat-label', item: label})}),
            box({width: 120, item: `median ${median}`}),
            box({item: `p95 ${p95}`})
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
            modelConfig: {defaultSize: 260, collapsible: true},
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
                    })
                ]
            }),
            item: grid({model: model.comparisonGridModel})
        });
    }
});
