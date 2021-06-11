import {grid} from '@xh/hoist/cmp/grid';
import {filler, fragment} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {taskDialog} from './TaskDialog';
import {TodoPanelModel} from './TodoPanelModel';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {recordActionBar} from '@xh/hoist/desktop/cmp/record';

export const todoPanel = hoistCmp.factory({
    model: creates(TodoPanelModel),

    render({model}) {
        return panel({
            tbar: tbar(),
            item: fragment(
                taskDialog(),
                grid()
            ),
            ref: model.panelRef,
            mask: 'onLoad',
            bbar: bbar()
        });
    }
});

const tbar = hoistCmp.factory(
    ({model}) => {
        const {selModel} = model.gridModel,
            {addAction, editAction, deleteAction, toggleCompleteAction} = model;

        return toolbar(
            recordActionBar({
                selModel,
                actions: [addAction, editAction, deleteAction]
            }),
            filler(),
            recordActionBar({
                selModel,
                actions: [toggleCompleteAction]
            })
        );
    }
);

const bbar = hoistCmp.factory(
    () => toolbar(
        switchInput({
            bind: 'showGroups',
            label: 'Show in Groups'
        }),
        filler(),
        switchInput({
            bind: 'showCompleted',
            label: 'Show Completed'
        })
    )
);