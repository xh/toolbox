import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {fragment, filler} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon/Icon';
import {taskDialog} from './TaskDialog';
import {TodoPanelModel} from './TodoPanelModel';

export const todoPanel = hoistCmp.factory({
    model: creates(TodoPanelModel),

    render() {
        return fragment(
            taskDialog(),
            panel({
                tbar: tbar(),
                item: grid()
            })
        );
    }
});

const tbar = hoistCmp.factory(
    ({model}) => {
        const {taskDialogModel, selectedTasks} = model,
            task = selectedTasks[0]?.data,
            count = selectedTasks.length;

        return toolbar({
            enableOverflowMenu: true,
            items: [
                button({
                    icon: Icon.add(),
                    text: 'New',
                    intent: 'success',
                    onClick: () => taskDialogModel.openAddForm()
                }),
                toolbarSep(),
                button({
                    icon: Icon.edit(),
                    text: 'Edit',
                    intent: 'primary',
                    disabled: count !== 1,
                    onClick: () => taskDialogModel.openEditForm(task)
                }),
                button({
                    icon: Icon.delete(),
                    text: 'Remove',
                    intent: 'danger',
                    disabled: !count,
                    onClick: () => model.removeTasksAsync()
                }),
                filler(),
                button({
                    icon: Icon.check(),
                    text: 'Mark Complete',
                    disabled: !count || task.complete,
                    onClick: () => model.toggleCompleteAsync(true)
                }),
                button({
                    icon: Icon.reset(),
                    text: 'Mark In Progress',
                    disabled: !count || !task.complete,
                    onClick: () => model.toggleCompleteAsync(false)
                }),
                toolbarSep(),
                gridCountLabel({unit: 'task'}),
                toolbarSep(),
                buttonGroupInput({
                    bind: 'filterBy',
                    outlined: true,
                    items: [
                        button({text: 'All', value: 'all'}),
                        button({text: 'In Progress', value: 'active'}),
                        button({text: 'Complete', value: 'complete'})
                    ]
                })
            ]
        });
    }
);