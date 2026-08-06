import {grid} from '@xh/hoist/cmp/grid';
import {code, filler, hframe, span, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {PivotInspectModel} from './PivotInspectModel';

/**
 * A small enough PivotView to check by hand - raw records in, pivoted rows out, with the pivot paths
 * and the synthetic Store fields that connect the two shown alongside.
 */
export const PivotInspectPanel = hoistCmp({
    displayName: 'PivotInspectPanel',
    model: creates(PivotInspectModel),

    render({model}) {
        return panel({
            tbar: tbar(),
            item: vframe(
                hframe(
                    panel({
                        title: 'Raw records loaded into the Cube',
                        icon: Icon.database(),
                        width: 470,
                        item: grid({model: model.rawGridModel})
                    }),
                    panel({
                        title: 'PivotView result - as loaded into a connected Store',
                        icon: Icon.grid(),
                        flex: 1,
                        item: grid({model: model.pivotGridModel})
                    })
                ),
                panel({
                    title: 'result.paths  /  result.cellFields - one Store field per entry',
                    icon: Icon.treeList(),
                    modelConfig: {
                        side: 'bottom',
                        defaultSize: 210,
                        collapsible: true,
                        resizable: true
                    },
                    item: hframe(
                        grid({model: model.pathGridModel, flex: 1}),
                        grid({model: model.fieldGridModel, flex: 1})
                    )
                }),
                panel({
                    title: 'result.rows - the published row data, verbatim',
                    icon: Icon.json(),
                    modelConfig: {
                        side: 'bottom',
                        defaultSize: 260,
                        collapsible: true,
                        resizable: true
                    },
                    className: 'xh-pad',
                    scrollable: true,
                    item: code({
                        style: {whiteSpace: 'pre', fontSize: 11},
                        item: model.rowJson
                    })
                })
            ),
            bbar: bbar()
        });
    }
});

const tbar = hoistCmp.factory<PivotInspectModel>(({model}) =>
    toolbar(
        button({
            intent: 'primary',
            icon: Icon.play(),
            text: 'Build',
            onClick: () => model.buildAsync()
        }),
        button({
            icon: Icon.expand(),
            text: 'Expand all',
            onClick: () => model.pivotGridModel.expandAll()
        }),
        button({
            icon: Icon.bolt(),
            text: 'Tick (+100)',
            title: 'Add 100 to the first record and let the incremental update flow through',
            onClick: () => model.tickAsync()
        }),
        toolbarSep(),
        'Pivot dims:',
        button({
            text: '1 - region',
            active: model.pivotDepth === 1,
            onClick: () => (model.pivotDepth = 1)
        }),
        button({
            text: '2 - region >> sector',
            title: 'Two pivot dimensions materialize pivot totals at the parent path',
            active: model.pivotDepth === 2,
            onClick: () => (model.pivotDepth = 2)
        }),
        toolbarSep(),
        switchInput({label: 'Sparse', bind: 'sparse'}),
        switchInput({label: 'includeRoot', bind: 'includeRoot'}),
        switchInput({label: 'includeLeaves', bind: 'includeLeaves'}),
        filler(),
        span({item: model.status, style: {fontWeight: 600}})
    )
);

const bbar = hoistCmp.factory<PivotInspectModel>(() =>
    toolbar(
        span({
            item:
                'Values are 10, 20, ... 80 so every aggregate is checkable by hand. On the 1-dim ' +
                'preset: Fund 1 / Strat A reads US 10, EU 20, TOTAL 30, and the totals row reads ' +
                'US 160, EU 200, TOTAL 360.',
            style: {fontStyle: 'italic', opacity: 0.8}
        })
    )
);
