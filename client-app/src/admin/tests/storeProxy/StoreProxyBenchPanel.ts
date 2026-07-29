import {grid} from '@xh/hoist/cmp/grid';
import {code, div, filler, hframe, li, p, ul, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {FIELD_COUNT, VIEW_FIELDS} from './StoreProxyBenchData';
import {MODE_DESCRIPTIONS, MODE_LABELS, StoreProxyBenchModel} from './StoreProxyBenchModel';
import './StoreProxyBenchPanel.scss';

export const StoreProxyBenchPanel = hoistCmp({
    className: 'tb-store-proxy-bench',
    model: creates(StoreProxyBenchModel),

    render({className}) {
        return panel({
            className,
            item: hframe(
                panel({
                    title: 'Store Proxy Mode › Benchmark',
                    icon: Icon.chartLine(),
                    flex: 1,
                    tbar: tbar(),
                    item: grid(),
                    bbar: bbar(),
                    mask: 'onLoad'
                }),
                notesPanel()
            )
        });
    }
});

const tbar = hoistCmp.factory<StoreProxyBenchModel>(({model}) =>
    toolbar(
        'Records:',
        select({
            bind: 'recordCount',
            options: [5000, 10000, 30000, 50000, 100000],
            width: 110
        }),
        button({
            intent: 'success',
            icon: Icon.refresh(),
            text: 'Load Cube',
            onClick: () => model.loadCube()
        }),
        toolbarSep(),
        'Update rows:',
        select({
            bind: 'updateCount',
            options: [100, 500, 1000, 5000],
            width: 90
        }),
        toolbarSep(),
        button({
            intent: 'primary',
            icon: Icon.play(),
            text: 'Run All',
            disabled: !model.cubeCount,
            onClick: () => model.runAll()
        }),
        ...(['proxy', 'copy', 'view', 'viewRaw'] as const).map(mode =>
            button({
                text: MODE_LABELS[mode],
                disabled: !model.cubeCount,
                onClick: () => model.runMode(mode)
            })
        ),
        filler(),
        button({
            icon: Icon.reset(),
            text: 'Clear Results',
            onClick: () => model.clearResults()
        })
    )
);

const bbar = hoistCmp.factory<StoreProxyBenchModel>(({model}) =>
    toolbar(
        div({className: 'tb-store-proxy-bench__status', item: model.status}),
        filler(),
        model.cubeCount
            ? `Cube: ${model.cubeCount.toLocaleString()} records × ${FIELD_COUNT} fields`
            : null,
        model.heapImprecise ? toolbarSep() : null,
        model.heapImprecise ? 'Heap readings imprecise - missing memory flags' : null
    )
);

const notesPanel = hoistCmp.factory(() =>
    panel({
        title: 'What is measured',
        icon: Icon.info(),
        modelConfig: {side: 'right', defaultSize: 380},
        className: 'tb-store-proxy-bench__notes',
        item: vbox(
            p(
                'A single source Cube holds all records at ',
                code(`${FIELD_COUNT} fields`),
                '. Each mode below builds one downstream Store from it, in isolation - the prior ' +
                    'target is destroyed and the heap re-sampled before the next run, so every ' +
                    'delta is attributable to that mode alone.'
            ),
            ul(
                ...(['proxy', 'copy', 'view', 'viewRaw'] as const).map(mode =>
                    li(code(MODE_LABELS[mode]), ' - ', MODE_DESCRIPTIONS[mode])
                )
            ),
            p(
                'The View modes query ',
                code(`${VIEW_FIELDS.length} of ${FIELD_COUNT}`),
                ' fields with no dimensions and ',
                code('includeLeaves: true'),
                ', so they materialize a narrower row than proxy or copy - that narrowing is part ' +
                    'of the trade-off being quantified, not a flaw in the comparison.'
            ),
            p(
                code('Heap Δ'),
                ' is the retained cost of the target on top of the loaded Cube, sampled after a ' +
                    'forced GC. ',
                code('Update'),
                ' times how long a Cube update of the configured row count takes to reach the target.'
            ),
            p(
                'String values come from shared pools, so they cost one reference per record. ' +
                    'That isolates per-record object overhead - the cost proxy mode avoids ' +
                    'duplicating - rather than measuring character data.'
            )
        )
    })
);
