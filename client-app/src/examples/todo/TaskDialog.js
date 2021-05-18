import {uses, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler, hbox, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {dateInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {TaskDialogModel} from './TaskDialogModel';
import {dialog} from '@xh/hoist/kit/blueprint';

export const taskDialog = hoistCmp.factory({
    model: uses(TaskDialogModel),

    render({model}) {
        return dialog({
            title: 'Add a Task',
            icon: Icon.add(),
            style: {width: 450},
            isOpen: model.isOpen,
            onClose: () => model.setIsOpen(false),
            item: formPanel()
        });
    }
});

const formPanel = hoistCmp.factory({
    render() {
        return panel({
            item: form(
                vbox(description(), dueDate())
            ),
            bbar: bbar()
        });
    }
});

const description = hoistCmp.factory(
    () => formField({field: 'description', item: textInput()})
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
            onClick: () => model.reset()
        }),
        filler(),
        button({
            text: 'Submit',
            icon: Icon.check(),
            disabled: !model.formModel.isValid,
            minimal: false,
            intent: 'success',
            onClick: () => model.submitAsync()
        })
    )
);