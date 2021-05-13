import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {todoFormPanel} from './TodoFormPanel';
import './TodoPanel.scss';
import {TodoPanelModel} from './TodoPanelModel';

export const todoPanel = hoistCmp.factory({
    model: creates(TodoPanelModel),

    render() {
        return hframe(
            todoFormPanel(),
            panel({
                flex: 1,
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
