import {form, FormModel} from '@xh/hoist/cmp/form';
import {creates, hoistCmp, managed} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {dateInput, DateInputProps, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import moment from 'moment';
import {
    demoFrame,
    demoGrid,
    demoPlayground,
    demoRow,
    fmtDemoConfig,
    raw,
    wrapperOption
} from '../../../common';
import {inputEntry} from './InputCatalog';
import {InputDemoModel} from './InputDemoModel';
import {inputDemoPage} from './InputDemoPage';

const ENTRY = inputEntry('DateInput');

export const dateInputPanel = hoistCmp.factory({
    displayName: 'DateInputPanel',
    model: creates(() => DateInputPanelModel),

    render({model}) {
        const {ambientProps, ambientSnippetProps, formFieldProps} = model;
        return inputDemoPage({
            entry: ENTRY,
            description: [
                'Date and optional time entry with a calendar popover. Binds a JS `Date` by',
                "default, or a `LocalDate` with `valueType: 'localDate'` for day-level values that",
                'survive timezones.',
                '',
                'Typed entry parses several formats; `minDate` and `maxDate` bound the picker.',
                '',
                'Commits on every change by default - turn the ambient switch off to commit on',
                'blur instead.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/DateInputPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/input/DateInput.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/utils/datetime/LocalDate.ts',
                    notes: 'Day-level date type.'
                },
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                }
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Clear button',
                    propName: 'DateInputProps.enableClear',
                    control: switchInput({bind: 'pgEnableClear'})
                }),
                wrapperOption({
                    label: 'Left icon',
                    propName: 'DateInputProps.leftIcon',
                    control: switchInput({bind: 'pgLeftIcon'})
                }),
                wrapperOption({
                    label: 'Time precision',
                    propName: 'DateInputProps.timePrecision',
                    control: select({
                        bind: 'pgTimePrecision',
                        enableFilter: false,
                        width: 110,
                        options: ['none', 'minute', 'second']
                    })
                }),
                wrapperOption({
                    label: 'Actions bar',
                    propName: 'DateInputProps.showActionsBar',
                    info: 'Today and Clear buttons under the calendar.',
                    control: switchInput({bind: 'pgActionsBar'})
                })
            ],
            playground: demoPlayground({
                config: fmtDemoConfig<DateInputProps>('dateInput', {
                    bind: 'value',
                    enableClear: model.pgEnableClear || undefined,
                    leftIcon: model.pgLeftIcon ? raw('Icon.calendar()') : undefined,
                    timePrecision:
                        model.pgTimePrecision === 'none' ? undefined : model.pgTimePrecision,
                    showActionsBar: model.pgActionsBar || undefined,
                    ...ambientSnippetProps,
                    width: '100%'
                }),
                value: model.playground,
                item: dateInput({
                    bind: 'playground',
                    ...ambientProps,
                    enableClear: model.pgEnableClear,
                    leftIcon: model.pgLeftIcon ? Icon.calendar() : null,
                    timePrecision: model.pgTimePrecision === 'none' ? null : model.pgTimePrecision,
                    showActionsBar: model.pgActionsBar,
                    width: '100%'
                })
            }),
            variants: [
                demoRow({
                    label: 'Min and max date',
                    info: 'minDate, maxDate, enableClear',
                    item: dateInput({
                        bind: 'minMax',
                        ...ambientProps,
                        minDate: moment().subtract(5, 'weeks').toDate(),
                        maxDate: moment().add(2, 'weeks').toDate(),
                        enableClear: true,
                        placeholder: 'YYYY-MM-DD',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'LocalDate valued',
                    info: "valueType: 'localDate'",
                    item: dateInput({
                        bind: 'localDate',
                        ...ambientProps,
                        valueType: 'localDate',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Time with AM/PM',
                    info: "timePrecision: 'minute', timePickerProps: {useAmPm: true}",
                    item: dateInput({
                        bind: 'timeAmPm',
                        ...ambientProps,
                        timePrecision: 'minute',
                        timePickerProps: {useAmPm: true},
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Custom format',
                    info: "formatString: 'MM/DD/YYYY'",
                    item: dateInput({
                        bind: 'customFormat',
                        ...ambientProps,
                        formatString: 'MM/DD/YYYY',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true',
                    item: dateInput({
                        bind: 'disabledDate',
                        ...ambientProps,
                        disabled: true,
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Invalid',
                    info: 'Bound to a failing FormField rule',
                    item: form({
                        model: model.formModel,
                        item: formField({
                            field: 'invalidDate',
                            label: null,
                            minimal: true,
                            ...formFieldProps,
                            item: dateInput()
                        })
                    })
                })
            ],
            toolbarItems: () => [
                dateInput({bind: 'tbarDate', ...ambientProps, width: 130}),
                toolbarSep(),
                dateInput({
                    bind: 'tbarLocalDate',
                    ...ambientProps,
                    valueType: 'localDate',
                    leftIcon: Icon.calendar(),
                    enableClear: true,
                    width: 160
                })
            ],
            form: demoGrid({
                columns: 2,
                items: [
                    demoFrame({
                        info: 'FormField, label above, required rule satisfied',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'startDate',
                                ...formFieldProps,
                                item: dateInput({valueType: 'localDate'})
                            })
                        })
                    }),
                    demoFrame({
                        info: 'Inline label, validation message below the field',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'endDate',
                                inline: true,
                                ...formFieldProps,
                                item: dateInput()
                            })
                        })
                    })
                ]
            })
        });
    }
});

const SEEDS = {
    playground: moment().startOf('hour').toDate(),
    minMax: null,
    localDate: LocalDate.today(),
    timeAmPm: moment().startOf('hour').toDate(),
    customFormat: new Date(),
    disabledDate: new Date(),
    tbarDate: null,
    tbarLocalDate: null
};

class DateInputPanelModel extends InputDemoModel {
    // Playground props
    @bindable pgEnableClear = true;
    @bindable pgLeftIcon = false;
    @bindable pgTimePrecision: 'none' | 'minute' | 'second' = 'none';
    @bindable pgActionsBar = false;

    // Inputs
    @bindable.ref playground: Date = SEEDS.playground;
    @bindable.ref minMax: Date = SEEDS.minMax;
    @bindable.ref localDate: LocalDate = SEEDS.localDate;
    @bindable.ref timeAmPm: Date = SEEDS.timeAmPm;
    @bindable.ref customFormat: Date = SEEDS.customFormat;
    @bindable.ref disabledDate: Date = SEEDS.disabledDate;
    @bindable.ref tbarDate: Date = SEEDS.tbarDate;
    @bindable.ref tbarLocalDate: LocalDate = SEEDS.tbarLocalDate;

    @managed
    override formModel = new FormModel({
        fields: [
            {
                name: 'startDate',
                displayName: 'Start date',
                initialValue: LocalDate.today(),
                rules: [required]
            },
            {name: 'endDate', displayName: 'End date', initialValue: null, rules: [required]},
            {name: 'invalidDate', initialValue: null, rules: [required]}
        ]
    });

    get inputSeeds() {
        return SEEDS;
    }

    constructor() {
        super({commitOnChangeDefault: true});
        makeObservable(this);
        // Show the failing rules on load - FormField displays messages only after validation runs.
        this.formModel.validateAsync();
    }
}
