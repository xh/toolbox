import {grid} from '@xh/hoist/cmp/grid';
import {filler, span, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {numberInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {PERF_CONFIGS, PivotPerfModel} from './PivotPerfModel';

export const PivotPerfPanel = hoistCmp({
    displayName: 'PivotPerfPanel',
    model: creates(PivotPerfModel),

    render({model}) {
        return panel({
            tbar: tbar(),
            bbar: bbar(),
            mask: model.running ? 'onLoad' : null,
            item: vframe(
                grid({testId: 'pivot-perf', flex: 1}),
                panel({
                    title: 'Grid under test',
                    modelConfig: {side: 'bottom', defaultSize: 260, collapsible: false},
                    item: harnessGrid()
                })
            )
        });
    }
});

/**
 * The grid being measured, genuinely mounted - ag-Grid is only instantiated by a rendered `grid()`,
 * so measuring an unmounted GridModel reports the model layer and calls it the grid layer.
 */
const harnessGrid = hoistCmp.factory<PivotPerfModel>(({model}) =>
    model.activeGrid ? grid({model: model.activeGrid}) : null
);

const tbar = hoistCmp.factory<PivotPerfModel>(({model}) =>
    toolbar(
        button({
            intent: 'primary',
            icon: Icon.play(),
            text: 'Run Matrix',
            disabled: model.running,
            onClick: () => model.runAllAsync()
        }),
        toolbarSep(),
        switchInput({bind: 'withoutGrid', label: 'Data layer'}),
        switchInput({bind: 'withGrid', label: 'With grid'}),
        toolbarSep(),
        'Tick reps',
        numberInput({bind: 'reps', width: 55, min: 1, max: 11}),
        filler(),
        span({
            omit: model.heapAvailable,
            item: 'Heap unavailable - relaunch with --enable-precise-memory-info --js-flags=--expose-gc',
            style: {color: 'var(--xh-intent-warning)'}
        }),
        span({omit: !model.status, item: model.status, style: {opacity: 0.8}})
    )
);

const bbar = hoistCmp.factory<PivotPerfModel>(({model}) =>
    toolbar(
        span({item: 'Single config:', style: {opacity: 0.7}}),
        ...PERF_CONFIGS.map(c =>
            button({
                text: c.id,
                disabled: model.running,
                title: c.label,
                onClick: () => model.runConfigAsync(c.id)
            })
        )
    )
);
