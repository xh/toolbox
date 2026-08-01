import {grid} from '@xh/hoist/cmp/grid';
import {code, div, filler, hframe, li, p, span, ul, vbox, vframe} from '@xh/hoist/cmp/layout';
import {pivotGrid} from '@xh/hoist/cmp/pivotgrid';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {numberInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {PROFILES} from './PivotBenchData';
import {PivotBenchModel} from './PivotBenchModel';
import './PivotBenchPanel.scss';

export const PivotBenchPanel = hoistCmp({
    displayName: 'PivotBenchPanel',
    className: 'tb-pivot-bench',
    model: creates(PivotBenchModel),

    render({className, model}) {
        return panel({
            className,
            item: hframe(
                vframe(
                    panel({
                        title: 'PivotGrid › Benchmark',
                        icon: Icon.chartLine(),
                        flex: 1,
                        tbar: tbar(),
                        item: grid(),
                        bbar: bbar(),
                        mask: model.runTask
                    }),
                    livePanel()
                ),
                notesPanel()
            )
        });
    }
});

const tbar = hoistCmp.factory<PivotBenchModel>(({model}) =>
    toolbar(
        button({
            intent: 'primary',
            icon: Icon.play(),
            text: 'Run All',
            disabled: model.running,
            onClick: () => model.runAll()
        }),
        toolbarSep(),
        ...PROFILES.map(profile =>
            button({
                text: profile.label,
                intent: profile.optIn ? 'warning' : null,
                disabled: model.running,
                title: profile.description,
                onClick: () => model.runProfile(profile.id)
            })
        ),
        filler(),
        'Tick %:',
        numberInput({bind: 'tickPct', width: 60, min: 0.1, max: 100, stepSize: 0.5}),
        'Reps:',
        numberInput({bind: 'tickReps', width: 55, min: 1, max: 25}),
        toolbarSep(),
        switchInput({bind: 'showGrid', label: 'Keep grid', labelSide: 'left'}),
        button({
            icon: Icon.reset(),
            text: 'Clear',
            onClick: () => model.clearResults()
        })
    )
);

const bbar = hoistCmp.factory<PivotBenchModel>(({model}) =>
    toolbar(
        div({className: 'tb-pivot-bench__status', item: model.status}),
        filler(),
        model.heapAvailable
            ? null
            : span({
                  className: 'tb-pivot-bench__warn',
                  item: 'Heap not measured - launch Chrome with --js-flags=--expose-gc --enable-precise-memory-info'
              })
    )
);

/** The live grid from the last run, kept only when `showGrid` is on. */
const livePanel = hoistCmp.factory<PivotBenchModel>(({model}) =>
    panel({
        title: 'Live PivotGrid (last run)',
        icon: Icon.grid(),
        compactHeader: true,
        omit: !model.showGrid,
        modelConfig: {side: 'bottom', defaultSize: 400, collapsible: true},
        item: model.pivotGridModel
            ? pivotGrid({model: model.pivotGridModel})
            : div({
                  className: 'tb-pivot-bench__empty',
                  item: 'Run a profile to populate.'
              })
    })
);

const notesPanel = hoistCmp.factory(() =>
    panel({
        title: 'What is measured',
        icon: Icon.info(),
        modelConfig: {side: 'right', defaultSize: 400, collapsible: true},
        className: 'tb-pivot-bench__notes',
        item: vbox(
            p(
                'Baseline for the PivotGrid rewrite. Each profile generates its own leaves, builds ' +
                    'the pivot from scratch, then ticks it repeatedly. The prior run is destroyed ' +
                    'first, so every measurement stands alone.'
            ),
            ul(
                li(
                    code('Data build'),
                    ' - ',
                    code('PivotDataModel.update()'),
                    ' alone: pivot metadata, leaf widening, Cube construction and the query.'
                ),
                li(
                    code('Grid build'),
                    ' - end-to-end ',
                    code('PivotGridModel.loadData()'),
                    ': the same data build plus Store field replacement, column building and the ' +
                        'grid load. Excludes the async autosize the prototype also fires.'
                ),
                li(
                    code('Tick'),
                    ' - median wall-clock for a values-only update touching the configured ' +
                        'percentage of leaves. Dimensions are never perturbed, so no new pivot ' +
                        'path appears and the column structure is unchanged.'
                ),
                li(
                    code('Synth fields'),
                    ' - the synthetic (pivot path × value field) fields the prototype widens each ' +
                        'leaf with. This is the number that drives its cost, because the Cube ' +
                        'aggregates densely over fields while the widened data is sparse over them.'
                )
            ),
            p(
                'The prototype has no incremental path - a tick is a full rebuild end to end, ' +
                    'including a fresh Cube. Tick times tracking build times is the expected ' +
                    'result and the thing the rewrite has to change.'
            ),
            p(
                code('Keep grid'),
                ' leaves the live grid mounted between runs. Useful for eyeballing correctness, ' +
                    'but it adds ag-Grid render work to every measurement - roughly doubling the ' +
                    'tick on Typical. Leave it off for numbers you intend to compare.'
            ),
            p(
                code('Pathological'),
                ' pivots on a near-unique dimension. It is not a target; it runs to locate the ' +
                    'cliff so phase 1 can decide what the framework should do about it.'
            )
        )
    })
);
