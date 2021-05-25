import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler, fragment} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon/Icon';
import {taskDialog} from './TaskDialog';
import {TodoPanelModel} from './TodoPanelModel';
import {every} from 'lodash';
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
        const {taskDialogModel, selectedTasks} = model,
            firstTask = selectedTasks[0],
            count = selectedTasks.length,
            allSame = every(selectedTasks, {complete: true}) || every(selectedTasks, {complete: false});

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
                    onClick: () => taskDialogModel.openEditForm(firstTask)
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
                    icon: count && firstTask.complete ? Icon.reset() : Icon.check(),
                    text: count && firstTask.complete ? 'Mark All In Progress' : 'Mark All Complete',
                    omit:  !count || count < 2 || !allSame,
                    onClick: () => model.toggleAllCompleteAsync(!firstTask.complete)
                }),
                toolbarSep({
                    omit:  !count || count < 2 || !allSame
                }),
                gridCountLabel({unit: 'task', showSelectionCount: 'never'})
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