import {grid} from '@xh/hoist/cmp/grid';
import {filler, fragment} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {taskDialog} from './TaskDialog';
import {TodoPanelModel} from './TodoPanelModel';
import {switchInput} from '@xh/hoist/desktop/cmp/input';


export const todoPanel = hoistCmp.factory({
    model: creates(TodoPanelModel),

    render({model}) {
        return fragment(
            taskDialog(),
            panel({
                tbar: tbar(),
                item: grid({onRowDoubleClicked: (e) => model.taskDialogModel.openEditForm(e.data.data)}),
                mask: 'onLoad',
                bbar: bbar()
            })
        );
    }
});

const tbar = hoistCmp.factory(
    ({model}) => {
        const {selModel} = model.gridModel,
            {addAction, editAction, deleteAction, toggleCompleteAction} = model;

        return toolbar({
            items: [
                recordActionBar({
                    selModel,
                    actions: [addAction]
                }),
                toolbarSep(),
                recordActionBar({
                    selModel,
                    actions: [editAction, deleteAction]
                }),
                filler(),
                recordActionBar({
                    selModel,
                    actions: [toggleCompleteAction]
                })
            ]
        });
    }
);

const bbar = hoistCmp.factory(
    () => {
        return toolbar({
            item: switchInput({
                bind: 'showCompleted',
                label: 'completed tasks'
            }),
            flexDirection: 'row',
            justifyContent: 'flex-end'
        });
    }
);