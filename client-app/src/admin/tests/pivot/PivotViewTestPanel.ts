import {grid} from '@xh/hoist/cmp/grid';
import {filler, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {numberInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {PivotViewTestModel} from './PivotViewTestModel';

export const PivotViewTestPanel = hoistCmp({
    displayName: 'PivotViewTestPanel',
    model: creates(PivotViewTestModel),

    render({model}) {
        return panel({
            title: 'PivotView › Correctness',
            icon: Icon.checkCircle(),
            tbar: tbar(),
            item: grid({testId: 'pivot-view-checks'})
        });
    }
});

const tbar = hoistCmp.factory<PivotViewTestModel>(({model}) =>
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
