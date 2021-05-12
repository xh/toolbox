import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {PERSIST_APP} from './AppModel';
import {todoFormPanel} from './TodoFormPanel';
import './TodoPanel.scss';
import {TodoPanelModel} from './TodoPanelModel';

export const todoPanel = hoistCmp.factory({
    model: creates(TodoPanelModel),

    render({model}) {
        return hframe(
            panel({
                item: todoFormPanel()
            }),
            panel({
                bbar: bbar(),
                item: grid()
                // mask: 'onLoad'
            })
        );
    }
});

const bbar = hoistCmp.factory(
    ({model}) => {
        return toolbar({
            style: {backgroundColor: 'transparent'},
            items: [
                textInput({
                    bind: 'searchQuery',
                    placeholder: 'Keyword Search',
                    width: 250,
                    commitOnChange: true,
                    enableClear: true
                }),
                toolbarSep(),
                buttonGroupInput({
                    bind: 'groupBy',
                    enableClear: true,
                    outlined: true,
                    items: [
                        button({text: 'All', value: 'all'}),
                        button({text: 'Active', value: 'task'}),
                        button({text: 'Complete', value: 'dueDate'})
                    ]
                }),
                toolbarSep(),
                gridCountLabel({unit: 'active task'})
            ]
        });
    }
);
