import {grid} from '@xh/hoist/cmp/grid';
import {code, div, filler, hbox, hspacer, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {clipboardButton} from '@xh/hoist/desktop/cmp/clipboard';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {viewManager} from '@xh/hoist/desktop/cmp/viewmanager';
import {Icon} from '@xh/hoist/icon';
import {dialog, tooltip} from '@xh/hoist/kit/blueprint';
import {GridTestBenchmarkModel} from './GridTestBenchmarkModel';
import './GridTestBenchmarkDialog.scss';

/** Command to relaunch Chrome with a real GC hook exposed to the page. */
const GC_LAUNCH_CMD = `open -a "Google Chrome" --args --js-flags="--expose-gc"`;

/**
 * Heap + timing harness for the Grid test panel - kept in a dialog to stay out of the way of the
 * panel itself. See GridTestBenchmarkModel for methodology.
 */
export const gridTestBenchmarkDialog = hoistCmp.factory({
    model: uses(GridTestBenchmarkModel),

    render({model}) {
        if (!model.isOpen) return null;

        return dialog({
            title: 'Store Benchmark',
            icon: Icon.stopwatch(),
            style: {width: '90vw', height: '75vh'},
            isOpen: true,
            canOutsideClickClose: false,
            onClose: () => model.close(),
            item: panel({
                items: [
                    intro(),
                    tbar(),
                    suspectBanner(),
                    grid({model: model.resultsGridModel, flex: 1})
                ],
                bbar: bbar(),
                mask: model.runTask
            })
        });
    }
});

/**
 * Orientation block - what a run measures, what each scenario means, and whether this browser
 * session can produce trustworthy heap numbers (with the fix-it command when it can't).
 */
const intro = hoistCmp.factory<GridTestBenchmarkModel>(() =>
    div({
        className: 'tb-benchmark-intro',
        items: [
            div(
                'Measures the heap and load-time cost of the dataset and Store flags currently ' +
                    'configured on the Grid test panel. Each iteration settles the heap, records ' +
                    'a baseline, runs one load of the chosen scenario, then settles again and ' +
                    'records the delta. Single measurements are noisy, so results report the ' +
                    'spread across iterations. Rows accumulate below - persisted across page ' +
                    'reloads - so different configs can be compared side by side.'
            ),
            div({
                className: 'tb-benchmark-intro__scenarios',
                items: [
                    ...scenarioRow(
                        'Cold load',
                        'Clear the grid, then measure a fresh load - the baseline cost of standing up the dataset.'
                    ),
                    ...scenarioRow(
                        'Reload (re-fetch)',
                        'Load once, then measure a reload of freshly fetched identical data - the way to see cross-fetch effects like Intern Strings.'
                    ),
                    ...scenarioRow(
                        'Reload (same raw refs)',
                        'Load once, then measure a reload of the very same raw objects - the only scenario where Reuse Records can hit.'
                    )
                ]
            }),
            gcStatus()
        ]
    })
);

function scenarioRow(name: string, desc: string) {
    return [
        div({className: 'tb-benchmark-intro__scenario-name', item: name}),
        div({className: 'tb-benchmark-intro__scenario-desc', item: desc})
    ];
}

/** Heap-measurement environment status, worst case first. */
const gcStatus = hoistCmp.factory<GridTestBenchmarkModel>(({model}) => {
    if (!model.hasHeapApi) {
        return div({
            className: 'tb-benchmark-intro__gc',
            items: [
                Icon.warning({intent: 'danger'}),
                span(
                    'This browser does not report performance.memory - heap deltas will be ' +
                        'blank. Use a Chromium browser.'
                )
            ]
        });
    }

    if (model.hasRealGc) {
        return div({
            className: 'tb-benchmark-intro__gc',
            items: [
                Icon.checkCircle({intent: 'success'}),
                span(
                    'Real GC available via window.gc - heap deltas are measured from a forced collection.'
                )
            ]
        });
    }

    return div({
        className: 'tb-benchmark-intro__gc',
        items: [
            Icon.warning({intent: 'warning'}),
            span(
                'No window.gc - the heap is settled with allocation pressure only, so deltas are approximate. For reliable numbers, relaunch Chrome with:'
            ),
            code(GC_LAUNCH_CMD),
            clipboardButton({
                text: null,
                minimal: true,
                getCopyText: () => GC_LAUNCH_CMD,
                successMessage: 'Launch command copied'
            })
        ]
    });
});

const tbar = hoistCmp.factory<GridTestBenchmarkModel>(({model}) =>
    toolbar(
        // Second instance of the panel's config chooser, bound to the same shared model - switch
        // saved configs between runs without dismissing the dialog. Chooser only: save/revert
        // stay on the panel rail, alongside the options they act on.
        viewManager({
            model: model.parent.viewManagerModel,
            showSaveButton: 'never',
            showRevertButton: 'never'
        }),
        toolbarSep(),
        select({
            bind: 'scenario',
            options: model.scenarioOptions,
            enableFilter: false,
            width: 200
        }),
        tooltip({
            content: 'Iterations per run - results are reported as a min/median/max spread.',
            item: numberInput({
                bind: 'iterations',
                min: 1,
                max: 20,
                width: 60
            })
        }),
        button({
            text: 'Run Benchmark',
            icon: Icon.play(),
            intent: 'success',
            disabled: model.isRunning,
            onClick: () => model.runBenchmark()
        }),
        toolbarSep(),
        span({item: model.status ?? '', className: 'xh-text-color-accent'}),
        filler(),
        button({
            text: 'Clear Results',
            icon: Icon.delete(),
            disabled: !model.results.length,
            onClick: () => model.clearResults()
        })
    )
);

/**
 * Compact "what will the next run measure" readout - config name (with dirty marker), dataset
 * volume, and load path. Full flag detail is recorded on each result row.
 */
const bbar = hoistCmp.factory<GridTestBenchmarkModel>(({model}) => {
    const {parent} = model,
        vm = parent.viewManagerModel,
        config = vm.view.name + (vm.isValueDirty ? ' *' : '');
    return toolbar({
        items: [
            filler(),
            span({
                item:
                    `Next run: "${config}" • ${parent.recordCount.toLocaleString()} records` +
                    ` • ${parent.useStreaming ? 'streaming' : 'JSON'} load`,
                className: 'xh-text-color-muted'
            })
        ],
        compact: true
    });
});

/**
 * Sits between the toolbar and the grid when the last run could not verify that every iteration
 * started from an uncontaminated baseline - see GridTestBenchmarkModel.runBenchmarkAsync.
 */
const suspectBanner = hoistCmp.factory<GridTestBenchmarkModel>(({model}) =>
    hbox({
        omit: !model.warning,
        alignItems: 'center',
        padding: 5,
        style: {background: 'var(--xh-intent-warning-trans1)'},
        items: [Icon.warning({intent: 'warning'}), hspacer(5), span(model.warning)]
    })
);
