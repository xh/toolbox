import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {frame} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {dialog} from '@xh/hoist/kit/blueprint';
import {Icon} from '@xh/hoist/icon/Icon';
import {formPanel} from './FormPanel';
import './TodoPanel.scss';
import {TodoPanelModel} from './TodoPanelModel';

export const todoPanel = hoistCmp.factory({
    model: creates(TodoPanelModel),

    render() {
        return frame(
            formDialog(),
            panel({
                flex: 1,
                tbar: topBar(),
                bbar: bbar(),
                item: grid()
            })
        );
    }
});

const bbar = hoistCmp.factory(
    () => {
        return toolbar({
            style: {backgroundColor: 'transparent'},
            items: [
                buttonGroupInput({
                    bind: 'filterBy',
                    outlined: true,
                    items: [
                        button({text: 'All', value: 'all'}),
                        button({text: 'In Progress', value: 'active'}),
                        button({text: 'Complete', value: 'complete'})
                    ]
                }),
                toolbarSep(),
                gridCountLabel({unit: 'task'})
            ]
        });
    }
);

const topBar = hoistCmp.factory(
    ({model}) => toolbar({
        compact: model.compact,
        enableOverflowMenu: true,
        items: [
            button({
                icon: Icon.add(),
                text: 'New',
                intent: 'success',
                onClick: () => model.dialogIsOpen = true
            }),
            button({
                icon: Icon.edit(),
                text: 'Edit',
                intent: 'primary',
                disabled: !model.selectedTask,
                onClick: () => {
                    model.dialogIsOpen = true;
                    model.selectedTask;
                }
            }),
            button({
                icon: Icon.check(),
                text: 'Mark Complete',
                disabled: !model.selectedTask || model.selectedTask.complete,
                onClick: async () => await model.toggleCompleteAsync(model.gridModel.selectedRecord)
            }),
            button({
                icon: Icon.reset(),
                text: 'Mark In Progress',
                disabled: !model.selectedTask?.complete,
                onClick: async () => await model.toggleCompleteAsync(model.gridModel.selectedRecord)
            }),
            button({
                icon: Icon.delete(),
                text: 'Delete',
                intent: 'danger',
                disabled: !model.selectedTasksLength,
                onClick: async () => await model.removeTaskAsync(model.gridModel.selectedRecord)
            })
        ]
    })
);

const formDialog = hoistCmp.factory(
    ({model}) => {
        return dialog({
            title: 'Add a Task',
            icon: Icon.add(),
            style: {width: 450},
            isOpen: model.dialogIsOpen,
            item: formPanel()
        });
    }
);