import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler, hbox, vbox, hframe, vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {dateInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {wrapper} from '../../desktop/common';
import {TodoFormPanelModel} from './TodoFormPanelModel';
import './TodoFormPanel.scss';

export const todoFormPanel = hoistCmp.factory({
    model: creates(TodoFormPanelModel),

    render() {
        return wrapper({
            item: panel({
                title: 'Add a Task',
                className: 'tbox-form-panel',
                icon: Icon.add(),
                // width: 470,
                height: 300,
                item: hframe(
                    formContent()
                )
            })
        });
    }
});

const formContent = hoistCmp.factory(
    ({model}) => panel({
        flex: 1,
        item: form({
            item: vframe({
                padding: 10,
                items: [
                    vbox({
                        flex: 'none',
                        items: [
                            task(),
                            // complete(),
                            dueDate()
                        ]
                    })
                ]
            })
        }),
        bbar: bbar()
    })
);

const task = hoistCmp.factory(
    () => formField({field: 'task', item: textInput()})
);

const dueDate = hoistCmp.factory(
    () => hbox(
        formField({
            field: 'dueDate',
            flex: 1,
            inline: false,
            item: dateInput({
                valueType: 'localDate',
                enableClear: true
            })
        })
    )
);

const bbar = hoistCmp.factory(
    ({model}) => toolbar(
        button({
            text: 'Reset',
            icon: Icon.reset({className: 'xh-red'}),
            onClick: () => model.reset(),
            disabled: !model.formModel.isDirty
        }),
        filler(),
        button({
            text: 'Submit',
            icon: Icon.check(),
            minimal: false,
            intent: 'success',
            onClick: () => model.submitAsync()
        })
    )
);