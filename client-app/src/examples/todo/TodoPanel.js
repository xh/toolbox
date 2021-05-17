import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {formPanel} from './FormPanel';
import './TodoPanel.scss';
import {TodoPanelModel} from './TodoPanelModel';

export const todoPanel = hoistCmp.factory({
    model: creates(TodoPanelModel),

    render(props) {
        return hframe(
            formPanel(),
            panel({
                flex: 1,
                bbar: props.model.selectedTasksLength <= 1 ? filters() : groupActions(),
                item: grid()
            })
        );
    }
});

const filters = hoistCmp.factory(
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

const groupActions = hoistCmp.factory(
    () => {
        return toolbar({
            style: {backgroundColor: 'transparent'},
            items: [
                buttonGroupInput({
                    bind: 'groupAction',
                    outlined: true,
                    items: [
                        button({text: 'Mark All Complete', value: 'markComplete'}),
                        button({text: 'Mark All In Progress', value: 'markActive'}),
                        button({text: 'Delete All', value: 'deleteAll'})
                    ]
                }),
                toolbarSep(),
                gridCountLabel({unit: 'task'})
            ]
        });
    }
);