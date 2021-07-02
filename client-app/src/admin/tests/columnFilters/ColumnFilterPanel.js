import {creates, hoistCmp} from '@xh/hoist/core';
import {filler, hframe} from '@xh/hoist/cmp/layout';
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {jsonInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';

import {ColumnFilterPanelModel} from './ColumnFilterPanelModel';

export const ColumnFilterPanel = hoistCmp({
    model: creates(ColumnFilterPanelModel),
    render({model}) {
        const {activeGridModel} = model;
        return hframe({
            items: [
                panel({
                    mask: 'onLoad',
                    icon: Icon.filter(),
                    title: 'Column Filter Test Grid',
                    tbar: tbar(),
                    item: grid({
                        key: activeGridModel.xhId,
                        model: activeGridModel
                    }),
                    bbar: bbar()
                }),
                filterJsonPanel()
            ]
        });
    }
});

const tbar = hoistCmp.factory(
    ({model}) => {
        const {activeFilterChooserModel} = model;
        return toolbar(
            filterChooser({
                key: activeFilterChooserModel.xhId,
                model: activeFilterChooserModel,
                flex: 1,
                enableClear: true
            })
        );
    }
);

const bbar = hoistCmp.factory(
    ({model}) => {
        const {isCubeMode, activeGridModel} = model;
        return toolbar(
            switchInput({
                bind: 'isCubeMode',
                label: 'Cube Mode'
            }),
            toolbarSep({omit: !isCubeMode}),
            isCubeMode ? groupingChooser() : null,
            filler(),
            gridCountLabel({
                key: activeGridModel.xhId,
                gridModel: activeGridModel,
                includeChildren: true
            })
        );
    }
);

const filterJsonPanel = hoistCmp.factory(
    ({model}) => {
        const prefix = model.isCubeMode ? 'Cube View' : 'Grid';
        return panel({
            model: {
                side: 'right',
                defaultSize: 500,
                collapsible: true
            },
            icon: Icon.code(),
            title: `${prefix} Filter as JSON`,
            item: jsonInput({
                flex: 1,
                width: '100%',
                bind: 'filterJson'
            })
        });
    }
);
