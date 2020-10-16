import {GridModel} from '@xh/hoist/cmp/grid';
import {fragment, label, spacer, vspacer} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {TreeStyle} from '@xh/hoist/core/enums/TreeStyle';
import {button} from '@xh/hoist/desktop/cmp/button';
import {select, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {sample} from 'lodash';
import {agGridOptions} from './AgGridOptions';

export const gridOptions = hoistCmp.factory({
    model: uses(GridModel),

    render({model}) {
        return fragment({
            items: [
                agGridOptions({model: model.agGridModel}),
                spacer({height: 10, omit: !model.treeMode}),
                label({
                    item: 'Tree Styles',
                    omit: !model.treeMode
                }),
                select({
                    bind: 'treeStyle',
                    width: null,
                    omit: !model.treeMode,
                    options: [
                        {value: TreeStyle.NONE, label: 'None'},
                        {value: TreeStyle.HIGHLIGHT_GROUPS, label: 'Highlight Groups'},
                        {value: TreeStyle.GROUP_BORDERS, label: 'Group Borders'},
                        {value: TreeStyle.HIGHLIGHT_GROUPS_WITH_BORDERS, label: 'Highlight Groups w/Borders'}
                    ]
                }),
                vspacer(10),
                label('Empty text (quick-filter to test)'),
                textInput({bind: 'emptyText', width: null}),
                vspacer(10),
                button({
                    text: 'Select random record',
                    icon: Icon.random(),
                    minimal: false,
                    onClick: () => {
                        const rec = sample(model.store.records);
                        if (rec) model.selModel.select(rec);
                    }
                }),
                button({
                    text: 'Scroll to selection',
                    icon: Icon.crosshairs(),
                    minimal: false,
                    onClick: () => model.ensureSelectionVisible()
                })
            ]
        });
    }
});
