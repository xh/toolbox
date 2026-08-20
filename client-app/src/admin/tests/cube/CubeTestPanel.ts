import {grid} from '@xh/hoist/cmp/grid';
import {filler, fragment, hframe, hspacer} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {CubeTestModel} from './CubeTestModel';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {diagnosticsPanel} from './DiagnosticsPanel';
import {colChooserButton, button} from '@xh/hoist/desktop/cmp/button';
import './CubeTestPanel.scss';

export const CubeTestPanel = hoistCmp({
    className: 'tb-cube-test-panel',
    model: creates(CubeTestModel),

    render({className, model}) {
        return panel({
            className,
            item: hframe(
                panel({
                    title: 'Grids › Cube Data',
                    icon: Icon.grid(),
                    flex: 1,
                    item: grid({model: model.gridModel}),
                    mask: 'onLoad',
                    tbar: tbar(),
                    bbar: bbar()
                }),
                diagnosticsPanel()
            )
        });
    }
});

const tbar = hoistCmp.factory<CubeTestModel>(() => fragment(queryBar(), storeBar()));

const queryBar = hoistCmp.factory<CubeTestModel>(({model}) =>
    toolbar(
        groupingChooser({model: model.groupingChooserModel}),
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
        'x',
        select({
            bind: 'recordMultiplier',
            options: [1, 2, 5, 10, 20, 50],
            width: 70
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

const storeBar = hoistCmp.factory<CubeTestModel>(() =>
    toolbar(
        switchInput({bind: 'projectionOnly', label: 'Projection Only', labelSide: 'left'}),
        switchInput({bind: 'reuseRecords', label: 'Reuse Records', labelSide: 'left'}),
        switchInput({bind: 'patchRecords', label: 'Patch Records', labelSide: 'left'}),
        switchInput({bind: 'throttleSort', label: 'Throttle Sort', labelSide: 'left'}),
        filler(),
        'Update Secs: ',
        select({
            bind: 'updateFreq',
            options: [-1, 0.1, 0.5, 1, 2, 5, 10, 20],
            width: 80
        }),
        hspacer(5),
        'Update Rows: ',
        select({
            bind: 'updateCount',
            options: [0, 5, 10, 100, 200, 500, 1000, 2000, 5000, 10000, 20000],
            width: 80
        })
    )
);

const bbar = hoistCmp.factory<CubeTestModel>(() =>
    toolbar(filler(), storeFilterField(), colChooserButton())
);
