import {uses, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler, hbox, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {dateInput, textArea} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {TaskDialogModel} from './TaskDialogModel';
import {dialog} from '@xh/hoist/kit/blueprint';

export const taskDialog = hoistCmp.factory({
    model: uses(TaskDialogModel),

    render({model}) {
        const {isAdd} = model;

        return dialog({
            title: isAdd ? 'New Task' : 'Edit Task',
            icon: isAdd ? Icon.add() : Icon.edit(),
            style: {width: 450},
            isOpen: model.isOpen,
            onClose: () => model.close(),
            usePortal: false,
            children: formPanel()
        });
    }
});

const formPanel = hoistCmp.factory(() =>
    panel({
        children: form(
            vbox({
                children: [description(), dueDate()],
                className: 'todo-form'
            })
        ),
        bbar: bbar()
    })
);

const description = hoistCmp.factory(() =>
    formField({
        field: 'description',
        children: textArea({
            autoFocus: true,
            commitOnChange: true
        })
    })
);

const dueDate = hoistCmp.factory(() =>
    hbox(
        formField({
            field: 'dueDate',
            flex: 1,
            inline: false,
            children: dateInput({
                valueType: 'localDate',
                enableClear: true
            })
        })
    )
);

const bbar = hoistCmp.factory<TaskDialogModel>(({model}) =>
    toolbar(
        filler(),
        button({
            text: 'Cancel',
            onClick: () => model.close()
        }),
        button({
            text: 'OK',
            icon: Icon.check(),
            disabled: !model.formModel.isValid,
            minimal: false,
            intent: 'success',
            onClick: () => model.submitAsync()
        })
    )
);
