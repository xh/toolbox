import {form} from '@xh/hoist/cmp/form';
import {div, filler, hbox, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {fmtPercent} from '@xh/hoist/format';
import './FormPage.scss';
import {Icon} from '@xh/hoist/icon';
import {button} from '@xh/hoist/mobile/cmp/button';
import {formField} from '@xh/hoist/mobile/cmp/form';
import {
    buttonGroupInput,
    checkbox,
    checkboxButton,
    dateInput,
    label,
    numberInput,
    searchInput,
    select,
    switchInput,
    textArea,
    textInput
} from '@xh/hoist/mobile/cmp/input';
import {menuButton} from '@xh/hoist/mobile/cmp/menu';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {FormPageModel} from './FormPageModel';

export const formPage = hoistCmp.factory({
    model: creates(FormPageModel),

    render({model}) {
        return panel({
            title: 'Form',
            icon: Icon.edit(),
            scrollable: true,
            className: 'tb-page tb-form-page xh-tiled-bg',
            items: [formCmp(), results()],
            bbar: [
                setFocusMenu(),
                filler(),
                checkboxButton({model: model.formModel, bind: 'readonly', text: 'Readonly'}),
                checkboxButton({bind: 'minimal', text: 'Min. validation'})
            ]
        });
    }
});

const formCmp = hoistCmp.factory<FormPageModel>(({model}) => {
    const {minimal, movies} = model;

    return div({
        className: 'tb-card',
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
                hbox({
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    items: [
                        formField({
                            field: 'enabled',
                            item: checkbox()
                        }),
                        formField({
                            field: 'enabled',
                            item: switchInput()
                        }),
                        formField({
                            field: 'enabled',
                            label: null, // checkboxButton is self-labelling, using fieldName for its text by default
                            item: checkboxButton()
                        })
                    ]
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
        className: 'tb-card',
        items: [
            fieldResult({field: 'name'}),
            fieldResult({field: 'customer'}),
            fieldResult({field: 'movie'}),
            fieldResult({field: 'salary'}),
            fieldResult({field: 'percentage', renderer: v => fmtPercent(v, {nullDisplay: '-'})}),
            fieldResult({field: 'date', renderer: v => v?.toString()}),
            fieldResult({field: 'enabled', renderer: v => (v ? 'Yes' : 'No')}),
            fieldResult({field: 'buttonGroup'}),
            fieldResult({field: 'notes'}),
            fieldResult({field: 'searchQuery'})
        ]
    });
});

const fieldResult = hoistCmp.factory<FormPageModel>(({model, field, renderer}) => {
    const {displayName, value} = model.formModel.fields[field],
        renderedVal = renderer ? renderer(value) : value;

    return div({
        className: 'tb-form-page__result',
        items: [label(displayName), div(renderedVal ?? '-')]
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
        title: 'Focus',
        menuPosition: 'top',
        menuItems
    });
});
