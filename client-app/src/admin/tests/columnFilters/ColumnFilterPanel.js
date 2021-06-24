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
        const {isTreeMode, gridModel, treeGridModel} = model;
        return hframe({
            items: [
                panel({
                    icon: Icon.filter(),
                    title: 'Column Filter Test Grid',
                    tbar: tbar(),
                    item: grid({
                        key: isTreeMode ? treeGridModel.xhId : gridModel.xhId,
                        model: isTreeMode ? treeGridModel : gridModel
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
        const {isTreeMode, gridFilterChooserModel, treeGridFilterChooserModel} = model,
            chooserModel = isTreeMode ? treeGridFilterChooserModel : gridFilterChooserModel;

        return toolbar(
            filterChooser({
                key: chooserModel.xhId,
                model: chooserModel,
                flex: 1,
                enableClear: true
            })
        );
    }
);

const bbar = hoistCmp.factory(
    ({model}) => {
        const {isTreeMode, gridModel, treeGridModel} = model,
            countModel = isTreeMode ? treeGridModel : gridModel;

        return toolbar(
            switchInput({
                bind: 'isTreeMode',
                label: 'Tree Mode'
            }),
            toolbarSep({omit: !isTreeMode}),
            isTreeMode ? groupingChooser() : null,
            filler(),
            gridCountLabel({
                key: countModel.xhId,
                gridModel: countModel,
                includeChildren: true
            })
        );
    }
);

const filterJsonPanel = hoistCmp.factory(
    () => {
        return panel({
            model: {
                side: 'right',
                defaultSize: 500,
                collapsible: true
            },
            icon: Icon.code(),
            title: 'Store Filter as JSON',
            item: jsonInput({
                flex: 1,
                width: '100%',
                bind: 'jsonFilterInput'
            })
        });
    }
);
