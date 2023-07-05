import {creates, hoistCmp} from '@xh/hoist/core';
import {div, filler, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';
import {button} from '@xh/hoist/mobile/cmp/button';
import {menuButton} from '@xh/hoist/mobile/cmp/menu';
import {Icon} from '@xh/hoist/icon';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/mobile/cmp/form';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {
    buttonGroupInput,
    checkbox,
    dateInput,
    label,
    numberInput,
    searchInput,
    select,
    switchInput,
    textArea,
    textInput
} from '@xh/hoist/mobile/cmp/input';
import {fmtPercent} from '@xh/hoist/format';
import './FormPage.scss';
import {FormPageModel} from './FormPageModel';

export const formPage = hoistCmp.factory({
    model: creates(FormPageModel),

    render() {
        return panel({
            title: 'Form',
            icon: Icon.edit(),
            scrollable: true,
            className: 'toolbox-page form-page xh-tiled-bg',
            items: [formCmp(), results()],
            bbar: bbar()
        });
    }
});

const formCmp = hoistCmp.factory<FormPageModel>(({model}) => {
    const {minimal, movies} = model;

    return div({
        className: 'toolbox-card',
        items: form({
            fieldDefaults: {minimal},
            items: vbox(
                formField({
                    field: 'name',
                    info: 'Min. 8 chars',
                    item: textInput({enableClear: true})
                }),
                formField({
                    field: 'customer',
                    item: select({
                        placeholder: 'Search customers...',
                        title: 'Search customers...',
                        enableFilter: true,
                        enableFullscreen: true,
                        queryFn: q => model.queryCustomersAsync(q)
                    })
                }),
                formField({
                    field: 'movie',
                    item: select({
                        placeholder: 'Select a Movie...',
                        options: movies
                    })
                }),
                formField({
                    field: 'salary',
                    item: numberInput({
                        enableShorthandUnits: false,
                        displayWithCommas: true
                    })
                }),
                formField({
                    field: 'percentage',
                    item: numberInput({
                        scaleFactor: 100,
                        valueLabel: '%'
                    })
                }),
                formField({
                    field: 'date',
                    item: dateInput({
                        minDate: LocalDate.today().subtract(2),
                        maxDate: LocalDate.today().add(1, 'month'),
                        textAlign: 'right',
                        valueType: 'localDate'
                    })
                }),
                formField({
                    field: 'included',
                    item: checkbox()
                }),
                formField({
                    field: 'enabled',
                    item: switchInput()
                }),
                formField({
                    field: 'buttonGroup',
                    item: buttonGroupInput(
                        button({
                            text: 'Button 1',
                            value: 'button1'
                        }),
                        button({
                            icon: Icon.moon(),
                            value: 'button2'
                        }),
                        button({
                            icon: Icon.skull(),
                            text: 'Button 2',
                            value: 'button3'
                        })
                    )
                }),
                formField({
                    field: 'notes',
                    item: textArea()
                }),
                formField({
                    field: 'searchQuery',
                    item: searchInput()
                })
            )
        })
    });
});

const results = hoistCmp.factory(() => {
    return div({
        className: 'toolbox-card',
        items: [
            fieldResult({field: 'name'}),
            fieldResult({field: 'customer'}),
            fieldResult({field: 'movie'}),
            fieldResult({field: 'salary'}),
            fieldResult({field: 'percentage', renderer: v => fmtPercent(v)}),
            fieldResult({field: 'date', renderer: v => v?.toString()}),
            fieldResult({field: 'included'}),
            fieldResult({field: 'enabled'}),
            fieldResult({field: 'buttonGroup'}),
            fieldResult({field: 'notes'}),
            fieldResult({field: 'searchQuery'})
        ]
    });
});

const bbar = hoistCmp.factory<FormPageModel>(({model}) =>
    toolbar({
        height: 38,
        items: [
            setFocusMenu(),
            filler(),
            label('Read-only'),
            switchInput({model: model.formModel, bind: 'readonly'}),
            label('Minimal validation'),
            switchInput({bind: 'minimal'})
        ]
    })
);

const fieldResult = hoistCmp.factory<FormPageModel>(({model, field, renderer}) => {
    const {displayName, value} = model.formModel.fields[field];
    return div({
        className: 'form-field-result',
        items: [label(displayName), div(renderer ? renderer(value) : value)]
    });
});

const setFocusMenu = hoistCmp.factory<FormPageModel>(({model}) => {
    const fields = model.formModel.fieldList,
        menuItems = fields.map(f => ({
            text: f.displayName,
            actionFn: () => f.focus()
        }));

    return menuButton({
        icon: Icon.target(),
        text: 'Focus',
        title: 'Focus',
        menuPosition: 'top',
        menuItems
    });
});
