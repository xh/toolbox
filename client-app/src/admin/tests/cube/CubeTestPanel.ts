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

export const CubeTestPanel = hoistCmp({
    model: creates(CubeTestModel),

    render() {
        return panel({
            item: hframe(
                dimensionManager({icon: Icon.cube()}),
                panel({
                    title: 'Grids › Cube Data',
                    icon: Icon.grid(),
                    flex: 1,
                    item: grid(),
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
        storeFilterField(),
        colChooserButton()
    );
});
