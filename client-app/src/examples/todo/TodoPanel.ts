import {grid} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button, printGridButton} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {recordActionBar} from '@xh/hoist/desktop/cmp/record';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {taskDialog} from './TaskDialog';
import {TodoPanelModel} from './TodoPanelModel';

export const todoPanel = hoistCmp.factory({
    model: creates(TodoPanelModel),

    render({model}) {
        return panel({
            ref: model.panelRef,
            mask: 'onLoad',
            tbar: tbar(),
            items: [grid({agOptions: {suppressMakeColumnVisibleAfterUnGroup: true}}), taskDialog()],
            bbar: bbar()
        });
    }
});

const tbar = hoistCmp.factory<TodoPanelModel>(({model}) => {
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
});

const bbar = hoistCmp.factory<TodoPanelModel>(({model}) =>
    toolbar(
        switchInput({
            bind: 'showGroups',
            label: 'Show in Groups'
        }),
        '-',
        switchInput({
            bind: 'showCompleted',
            label: 'Show Completed'
        }),
        filler(),
        button({
            icon: Icon.reset(),
            intent: 'danger',
            tooltip: 'Reset to example defaults.',
            onClick: () => model.resetToDefaultTasksAsync()
        }),
        printGridButton({title: 'Print Tasks'})
    )
);
