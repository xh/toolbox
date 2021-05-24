import {creates, hoistCmp} from '@xh/hoist/core';
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {filler, hframe} from '@xh/hoist/cmp/layout';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {jsonInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {ColumnFilterPanelModel} from './ColumnFilterPanelModel';
import {Icon} from '@xh/hoist/icon';

export const ColumnFilterPanel = hoistCmp({
    model: creates(ColumnFilterPanelModel),
    render({model}) {
        const {isTreeMode, gridModel, treeGridModel} = model;
        return hframe({
            items: [
                panel({
                    icon: Icon.filter(),
                    title: 'Column Filter Test Grid',
                    item: grid({
                        key: isTreeMode ? treeGridModel.xhId : gridModel.xhId,
                        model: isTreeMode ? treeGridModel : gridModel
                    }),
                    bbar: [
                        switchInput({
                            bind: 'isTreeMode',
                            label: 'Tree Mode'
                        }),
                        toolbarSep({omit: !isTreeMode}),
                        isTreeMode ? groupingChooser() : null,
                        filler(),
                        gridCountLabel({
                            gridModel: isTreeMode ? treeGridModel : gridModel,
                            includeChildren: true
                        })
                    ]
                }),
                panel({
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
                })
            ]
        });
    }
});
