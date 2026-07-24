import {grid} from '@xh/hoist/cmp/grid';
import {filler, hframe, hspacer} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeCountLabel, storeFilterField} from '@xh/hoist/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {CubeTestModel} from './CubeTestModel';
import {dimensionManager} from './dimensions/DimensionManager';
import {loadTimesPanel} from './LoadTimesPanel';
import {colChooserButton, button} from '@xh/hoist/desktop/cmp/button';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {tooltip} from '@xh/hoist/kit/blueprint';
import './CubeTestPanel.scss';

export const CubeTestPanel = hoistCmp({
    className: 'tb-cube-test-panel',
    model: creates(CubeTestModel),

    render({className, model}) {
        return panel({
            className,
            item: hframe(
                dimensionManager({icon: Icon.cube()}),
                panel({
                    title: 'Grids › Cube Data',
                    icon: Icon.grid(),
                    flex: 1,
                    // Pass gridModel explicitly - it is reassigned when adoptRawData toggles, and
                    // reading the observable ref here rebinds the grid to the rebuilt model.
                    item: grid({model: model.gridModel}),
                    mask: 'onLoad',
                    tbar: tbar(),
                    bbar: bbar()
                }),
                loadTimesPanel()
            )
        });
    }
});

const tbar = hoistCmp.factory<CubeTestModel>(({model}) =>
    toolbar(
        tooltip({
            content:
                'Zero-copy Store mode (hoist-react #4506) - adopts Cube row objects as record data by reference. Toggling rebuilds the grid + connected View.',
            item: switchInput({bind: 'adoptRawData', label: 'Adopt Raw', labelSide: 'left'})
        }),
        toolbarSep(),
        switchInput({bind: 'showSummary', label: 'Summary?', labelSide: 'left'}),
        switchInput({bind: 'includeLeaves', label: 'Leaves?', labelSide: 'left'}),
        switchInput({bind: 'includeGlobalAgg', label: 'Global Agg?', labelSide: 'left'}),
        select({
            bind: 'fundFilter',
            options: XH.portfolioService.lookups.funds,
            placeholder: 'Fund filter...',
            enableClear: true,
            enableMulti: true,
            width: 300
        }),
        filler(),
        'Update Secs: ',
        select({
            bind: 'updateFreq',
            options: [-1, 1, 2, 5, 10, 20],
            width: 80
        }),
        hspacer(5),
        'Update Rows: ',
        select({
            bind: 'updateCount',
            options: [0, 5, 10, 100, 200, 500, 1000, 2000, 5000, 10000, 20000],
            width: 80
        }),
        toolbarSep(),
        'x',
        tooltip({
            content: 'Replicate fetched orders NxN to stress-test at scale (applied on Load Cube)',
            item: select({
                bind: 'recordMultiplier',
                options: [1, 2, 5, 10, 20, 50],
                width: 70
            })
        }),
        toolbarSep(),
        button({
            icon: Icon.reset(),
            text: 'Clear Cube',
            onClick: () => model.clear()
        }),
        button({
            intent: 'success',
            icon: Icon.refresh(),
            text: 'Load Cube',
            onClick: () => model.loadAsync()
        })
    )
);

const bbar = hoistCmp.factory<CubeTestModel>(({model}) => {
    const {view} = model;
    return toolbar(
        storeCountLabel({store: view.cube.store, unit: 'cube facts'}),
        hspacer(2),
        'Last Updated:',
        relativeTimestamp({timestamp: view.info?.asOf}),
        filler(),
        model.heapMB != null
            ? `Heap: ${model.heapMB} MB${model.heapImprecise ? ' (imprecise)' : ''}`
            : null,
        tooltip({
            content:
                'GC + sample JS heap. For accurate numbers, launch Chrome with --js-flags=--expose-gc --enable-precise-memory-info (otherwise the reading is coarse).',
            item: button({
                icon: Icon.chartLine(),
                text: 'Measure Mem',
                onClick: () => model.measureMemory()
            })
        }),
        toolbarSep(),
        storeFilterField(),
        colChooserButton()
    );
});
