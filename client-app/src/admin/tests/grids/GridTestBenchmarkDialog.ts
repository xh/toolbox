import {grid} from '@xh/hoist/cmp/grid';
import {code, filler, hbox, hspacer, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {clipboardButton} from '@xh/hoist/desktop/cmp/clipboard';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {dialog, tooltip} from '@xh/hoist/kit/blueprint';
import {GridTestBenchmarkModel} from './GridTestBenchmarkModel';

/** Command to relaunch Chrome with a real GC hook exposed to the page. */
const GC_LAUNCH_CMD = `open -a "Google Chrome" --args --js-flags="--expose-gc"`;

/**
 * Heap + timing harness for the Grid test panel - kept in a dialog to stay out of the way of the
 * panel's (already dense) toolbars. See GridTestBenchmarkModel for methodology.
 */
export const gridTestBenchmarkDialog = hoistCmp.factory({
    model: uses(GridTestBenchmarkModel),

    render({model}) {
        if (!model.isOpen) return null;

        return dialog({
            title: 'Store Benchmark',
            icon: Icon.stopwatch(),
            style: {width: '90vw', height: '70vh'},
            isOpen: true,
            canOutsideClickClose: false,
            onClose: () => model.close(),
            item: panel({
                tbar: tbar(),
                items: [suspectBanner(), grid({model: model.resultsGridModel, flex: 1})],
                bbar: bbar(),
                mask: model.runTask
            })
        });
    }
});

const tbar = hoistCmp.factory<GridTestBenchmarkModel>(({model}) =>
    toolbar(
        tooltip({
            content:
                'Cold load - clear the grid, then measure a load. ' +
                'Reload (re-fetch) - load, then measure a second load of a freshly fetched copy ' +
                'of the same data (the only way to see cross-fetch internStrings). ' +
                'Reload (same raw refs) - load, then measure a second load of the *same* raw ' +
                'objects (the only way reuseRecords can hit, as it matches on reference identity).',
            item: select({
                bind: 'scenario',
                options: model.scenarioOptions,
                enableFilter: false,
                width: 200
            })
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
        clipboardButton({
            text: 'Copy as Markdown',
            icon: Icon.clipboard(),
            disabled: !model.results.length,
            getCopyText: () => model.resultsAsMarkdown,
            successMessage: 'Results copied as markdown'
        }),
        button({
            text: 'Clear Results',
            icon: Icon.delete(),
            disabled: !model.results.length,
            onClick: () => model.clearResults()
        })
    )
);

const bbar = hoistCmp.factory<GridTestBenchmarkModel>(({model}) =>
    toolbar({
        items: [
            gcModeNotice(),
            filler(),
            span({item: model.configSummary, className: 'xh-text-color-muted'})
        ],
        compact: true
    })
);

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

const gcModeNotice = hoistCmp.factory<GridTestBenchmarkModel>(({model}) => {
    if (!model.hasHeapApi) {
        return span({
            items: [
                Icon.warning({intent: 'danger'}),
                ' performance.memory unavailable - heap deltas will be blank. Use Chromium.'
            ]
        });
    }

    if (model.hasRealGc) {
        return span({
            items: [Icon.checkCircle({intent: 'success'}), ' Real GC available via window.gc.']
        });
    }

    return hbox({
        alignItems: 'center',
        items: [
            Icon.warning({intent: 'warning'}),
            span(
                ' No window.gc - settling with allocation pressure only. For reliable heap ' +
                    'numbers, relaunch Chrome with:'
            ),
            hspacer(5),
            code(GC_LAUNCH_CMD),
            hspacer(5),
            clipboardButton({
                text: null,
                minimal: true,
                getCopyText: () => GC_LAUNCH_CMD,
                successMessage: 'Launch command copied'
            })
        ]
    });
});
