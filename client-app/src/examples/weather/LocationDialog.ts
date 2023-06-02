import {uses, hoistCmp, DefaultHoistProps, HoistModelClass, useLocalModel} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box, div, filler, hbox, hframe, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {FieldModel, form, FormModel} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {dateInput, textArea} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {LocationDialogModel} from './LocationDialogModel';
import {dialog} from '@xh/hoist/kit/blueprint';
import {isString} from "lodash";
import {select} from "@xh/hoist/desktop/cmp/input";
import {cities} from "../../core/data/Cities";

export const locationDialog = hoistCmp.factory({
    model: uses(LocationDialogModel),

    render({model}) {
        return dialog({
            title: 'New Location',
            icon: Icon.add(),
            style: {width: 450},
            isOpen: model.isOpen,
            onClose: () => model.close(),
            usePortal: false,
            item: formPanel()
        });
    }
});

const formPanel = hoistCmp.factory({
    render() {
        return panel({
            item: form(
                vbox({
                    items: [location()],
                })
            ),
            bbar: bbar()
        })
    }
});

const location = hoistCmp.factory(
    () => formField({
        width: 400,
        field: 'locationSelect',
        item: select(
            {
            options: cities,
            enableClear: true,
            enableCreate: true,
            selectOnFocus: true,
            placeholder: 'Search locations...'
        }
        )
    }),
)

/*
const row = hoistCmp.factory<FormModel>({
    model: uses(FormModel),

    render({model, label, field, info, readonlyRenderer, fmtVal, layout = {}, children}) {
        const fieldModel = model.fields[field];

        if (!layout.width) layout.flex = 1;

        return box({
            className: 'inputs-panel-field-box',
            items: [
                fieldDisplay({fieldModel, fmtVal}),
                formField({
                    model: fieldModel,
                    item: children,
                    label,
                    info,
                    readonlyRenderer,
                    ...layout
                })
            ]
        });
    }
});

const fieldDisplay = hoistCmp.factory(
    ({fieldModel, fmtVal}) => {
        let displayVal = fieldModel ? fieldModel.value : null
        if (displayVal == null) {
            displayVal = 'null';
        } else {
            displayVal = fmtVal ? fmtVal(displayVal) : displayVal.toString();
            if (isString(displayVal) && displayVal.trim() === '') {
                displayVal = displayVal.length ? '[Blank String]' : '[Empty String]';
            }
        }
        return div({
            className: 'inputs-panel-field-display',
            item: displayVal
        });
    }
);

const showFromDate = hoistCmp.factory(() =>
    hbox(
        formField({
            field: 'showFromDate',
            flex: 1,
            inline: false,
            item: dateInput({
                valueType: 'localDate',
                enableClear: true
            })
        })
    )
);

 */

const bbar = hoistCmp.factory<LocationDialogModel>(({model}) =>
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
