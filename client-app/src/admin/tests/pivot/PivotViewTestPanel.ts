import {grid} from '@xh/hoist/cmp/grid';
import {filler, span, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {numberInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {PROFILES} from './PivotBenchData';
import {PivotViewBenchModel} from './PivotViewBenchModel';
import {PivotViewTestModel} from './PivotViewTestModel';

export const PivotViewTestPanel = hoistCmp({
    displayName: 'PivotViewTestPanel',
    model: creates(PivotViewTestModel),

    render() {
        return vframe(
            panel({
                title: 'PivotView › Correctness',
                icon: Icon.checkCircle(),
                flex: 1,
                tbar: checkTbar(),
                item: grid({testId: 'pivot-view-checks'})
            }),
            benchPanel()
        );
    }
});

const checkTbar = hoistCmp.factory<PivotViewTestModel>(({model}) =>
    toolbar(
        button({
            intent: 'primary',
            icon: Icon.play(),
            text: 'Run Suite',
            disabled: model.running,
            onClick: () => model.runAllAsync()
        }),
        toolbarSep(),
        'Tick %:',
        numberInput({bind: 'tickPct', width: 60, min: 0.1, max: 100, stepSize: 0.5}),
        filler(),
        span({
            omit: !model.checkCount,
            item: model.failureCount
                ? `${model.failureCount} of ${model.checkCount} checks FAILED`
                : `All ${model.checkCount} checks passed`,
            style: {
                color: model.failureCount ? 'var(--xh-intent-danger)' : 'var(--xh-intent-success)',
                fontWeight: 600
            }
        })
    )
);

const benchPanel = hoistCmp.factory({
    model: creates(PivotViewBenchModel),

    render({model}) {
        return panel({
            title: 'PivotView › Benchmark vs. phase 0 baseline',
            icon: Icon.chartLine(),
            modelConfig: {side: 'bottom', defaultSize: 320, collapsible: true, resizable: true},
            tbar: benchTbar(),
            item: grid({testId: 'pivot-view-bench'}),
            mask: model.running
        });
    }
});

const benchTbar = hoistCmp.factory<PivotViewBenchModel>(({model}) =>
    toolbar(
        button({
            intent: 'primary',
            icon: Icon.play(),
            text: 'Run All',
            disabled: model.running,
            onClick: () => model.runAllAsync()
        }),
        toolbarSep(),
        ...PROFILES.filter(p => !p.optIn).map(profile =>
            button({
                text: profile.label,
                disabled: model.running,
                title: profile.description,
                onClick: () => model.runProfileAsync(profile.id)
            })
        ),
        filler(),
        'Tick %:',
        numberInput({bind: 'tickPct', width: 60, min: 0.1, max: 100, stepSize: 0.5}),
        'Reps:',
        numberInput({bind: 'tickReps', width: 55, min: 1, max: 25}),
        span({omit: !model.status, item: model.status, style: {marginLeft: 10}})
    )
);
