import {filler, hframe, span, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {jsonInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {PivotInspectModel} from './PivotInspectModel';

const JSON_PROPS = {
    readonly: true,
    enableSearch: true,
    lineNumbers: false,
    flex: 1,
    width: '100%'
};

/** Side by side in an hframe, flex grows the input horizontally only - height has to be explicit. */
const SIDE_BY_SIDE_JSON_PROPS = {...JSON_PROPS, height: '100%'};

/**
 * A small enough PivotView to check by hand, shown as JSON at every stage - raw records in, published
 * rows out, the pivot paths and synthetic Store fields between, and the records a Grid would bind to.
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
                        title: '1. Raw records loaded into the Cube',
                        icon: Icon.database(),
                        width: 400,
                        item: jsonInput({value: model.rawJson, ...JSON_PROPS})
                    }),
                    panel({
                        title: '2. result.rows - published row data, verbatim',
                        icon: Icon.json(),
                        flex: 1,
                        item: jsonInput({value: model.rowsJson, ...JSON_PROPS})
                    })
                ),
                panel({
                    title: '3. result.paths  /  result.cellFields - one Store field per entry',
                    icon: Icon.treeList(),
                    modelConfig: {
                        side: 'bottom',
                        defaultSize: 260,
                        collapsible: true,
                        resizable: true
                    },
                    item: hframe(
                        jsonInput({value: model.pathsJson, ...SIDE_BY_SIDE_JSON_PROPS}),
                        jsonInput({value: model.cellFieldsJson, ...SIDE_BY_SIDE_JSON_PROPS})
                    )
                }),
                panel({
                    title: '4. Store records - the pivoted output as a Grid receives it',
                    icon: Icon.grid(),
                    modelConfig: {
                        side: 'bottom',
                        defaultSize: 280,
                        collapsible: true,
                        resizable: true
                    },
                    item: jsonInput({value: model.storeJson, ...JSON_PROPS})
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
