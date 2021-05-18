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
import './TodoPanel.scss';

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
        const {taskDialogModel, selectedTask, selectedTasksLength, gridModel} = model,
            {selectedRecord} = gridModel;

        return toolbar({
            enableOverflowMenu: true,
            items: [
                button({
                    icon: Icon.add(),
                    text: 'New',
                    intent: 'success',
                    onClick: () => taskDialogModel.openAddForm()
                }),
                button({
                    icon: Icon.edit(),
                    text: 'Edit',
                    intent: 'primary',
                    disabled: !selectedTask,
                    onClick: () => taskDialogModel.openEditForm(selectedTask)
                }),
                button({
                    icon: Icon.delete(),
                    text: 'Remove',
                    intent: 'danger',
                    disabled: !selectedTasksLength,
                    onClick: () => model.removeTaskAsync(selectedRecord)
                }),
                toolbarSep(),
                button({
                    icon: selectedTask?.complete ? Icon.reset() : Icon.check(),
                    text: selectedTask?.complete ? 'Mark In Progress' : 'Mark Complete',
                    disabled: !selectedTask,
                    onClick: () => model.toggleCompleteAsync(selectedRecord)
                }),
                filler(),
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