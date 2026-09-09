import {box, code, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, type Intent, managed} from '@xh/hoist/core';
import {
    DATE_RANGE_PICKER_TABS,
    DATE_RANGE_PRESET_TOKENS,
    dateRangePicker,
    type DateRangePickerProps,
    type DateRangeFormat,
    DateRangePickerModel,
    type DateRangePickerTab,
    type DateRangePreset,
    type DateRangePresetToken,
    DEFAULT_DATE_RANGE_PRESETS,
    type LocalDateRange
} from '@xh/hoist/desktop/cmp/daterange';
import {dateInput, intentInput, picker, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {isEmpty, sortBy} from 'lodash';
import {
    demoGrid,
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    fmtDemoConfig,
    raw,
    wrapper,
    wrapperOption,
    wrapperOptionGroup
} from '../../common';
import './DateRangePickerPanel.scss';

export const dateRangePickerPanel = hoistCmp.factory({
    displayName: 'DateRangePickerPanel',
    model: creates(() => DateRangePickerPanelModel),

    render({model}) {
        return wrapper({
            title: 'DateRangePicker',
            icon: Icon.calendarRange(),
            description: [
                '`DateRangePicker` is a dropdown for selecting a period of time - one compact',
                'trigger that expresses presets (MTD, Prev 30 Days), relative lookbacks, calendar',
                'months and years, or a custom range. The backing model controls which tabs and',
                'presets appear.',
                '',
                'The applied value is a plain-JSON `DateRangeSelection` that persists as-is and',
                're-resolves as the anchor day moves, so a saved `mtd` stays month-to-date. The step',
                'buttons walk a preset or lookback back and forth without changing what it is.',
                '',
                '`DateRangePickerModel` resolves that selection into current and prior',
                '`LocalDateRange`s and into `FieldFilterSpec`s ready to apply to a Store or query.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/DateRangePickerPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/daterange/DateRangePicker.ts',
                    notes: 'Hoist component.'
                },
                {
                    url: '$HR/cmp/daterange/DateRangePickerModel.ts',
                    notes: 'Hoist component model - config, value, ranges, and filters.'
                },
                {
                    url: '$HR/cmp/daterange/DateRangePresets.ts',
                    notes: 'Built-in presets, and the shape of app-defined ones.'
                }
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Component',
                    items: [
                        wrapperOption({
                            label: 'Style as input',
                            propName: 'DateRangePickerProps.styleButtonAsInput',
                            control: switchInput({bind: 'styleButtonAsInput'})
                        }),
                        wrapperOption({
                            label: 'Show range',
                            propName: 'DateRangePickerProps.showRange',
                            control: switchInput({bind: 'showRange'})
                        }),
                        wrapperOption({
                            label: 'Step buttons',
                            propName: 'DateRangePickerProps.showStepButtons',
                            info: 'Previous/next buttons move the applied range by its own length.',
                            control: switchInput({bind: 'showStepButtons'})
                        }),
                        wrapperOption({
                            label: 'Footer note',
                            propName: 'DateRangePickerProps.footerNote',
                            control: switchInput({bind: 'showFooterNote'})
                        }),
                        wrapperOption({
                            label: 'Intent',
                            propName: 'DateRangePickerProps.intent',
                            control: intentInput({bind: 'intent', enableClear: true})
                        })
                    ]
                }),
                wrapperOptionGroup({
                    label: 'Model',
                    items: [
                        wrapperOption({
                            label: 'Tabs',
                            propName: 'DateRangePickerConfig.tabs',
                            control: picker({
                                bind: 'tabs',
                                enableMulti: true,
                                enableFilter: false,
                                displayNoun: 'tab',
                                multiSelectButtonStyle: 'values',
                                width: 180,
                                options: DATE_RANGE_PICKER_TABS
                            })
                        }),
                        wrapperOption({
                            label: 'Presets',
                            propName: 'DateRangePickerConfig.presets',
                            control: picker({
                                bind: 'presets',
                                enableMulti: true,
                                enableSelectAll: true,
                                enableClear: true,
                                displayNoun: 'preset',
                                width: 180,
                                options: DATE_RANGE_PRESET_TOKENS
                            })
                        }),
                        wrapperOption({
                            label: 'Commit on change',
                            propName: 'DateRangePickerConfig.commitOnChange',
                            info: 'Relative and custom drafts apply as they change - no Apply or Cancel.',
                            control: switchInput({model: model.pickerModel, bind: 'commitOnChange'})
                        }),
                        wrapperOption({
                            label: 'Anchor day',
                            propName: 'DateRangePickerConfig.anchorDay',
                            alignTop: true,
                            info: 'Relative and to-date selections resolve against this day. The live modes follow the clock; a pinned date never moves.',
                            control: vbox({
                                gap: 6,
                                alignItems: 'flex-start',
                                items: [
                                    select({
                                        bind: 'anchorMode',
                                        enableFilter: false,
                                        width: 130,
                                        options: [
                                            {value: 'localDay', label: "'localDay'"},
                                            {value: 'appDay', label: "'appDay'"},
                                            {value: 'pinned', label: 'LocalDate'}
                                        ]
                                    }),
                                    dateInput({
                                        omit: model.anchorMode !== 'pinned',
                                        bind: 'anchorDate',
                                        valueType: 'localDate',
                                        width: 130
                                    })
                                ]
                            })
                        }),
                        wrapperOption({
                            label: 'Business day mode',
                            propName: 'DateRangePickerConfig.businessDayMode',
                            info: 'Single days step by business day (weekdays less a few fixed holidays here). Multi-day ranges are unaffected.',
                            control: switchInput({
                                model: model.pickerModel,
                                bind: 'businessDayMode'
                            })
                        }),
                        wrapperOption({
                            label: 'Max date',
                            propName: 'DateRangePickerConfig.maxDate',
                            info: 'Latest selectable date. Empty, it is the anchor date, so nothing in the future is selectable.',
                            control: dateInput({
                                bind: 'maxDate',
                                valueType: 'localDate',
                                enableClear: true,
                                width: 130
                            })
                        }),
                        wrapperOption({
                            label: 'Date format',
                            propName: 'DateRangePickerConfig.dateFormat',
                            info: 'For the two ends of a range.',
                            control: select({
                                bind: 'dateFormat',
                                enableFilter: false,
                                width: 150,
                                options: ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD MMM YYYY']
                            })
                        }),
                        wrapperOption({
                            label: 'Single day format',
                            propName: 'DateRangePickerConfig.singleDayFormat',
                            info: 'For a single day, and the anchor date in the footer. The last option is a function that adds the year only outside the current one.',
                            control: select({
                                bind: 'singleDayFormat',
                                enableFilter: false,
                                width: 150,
                                options: Object.keys(DAY_FORMATS)
                            })
                        })
                    ]
                })
            ],
            item: demoPanel({
                className: 'tb-drp-panel',
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 400,
                            value: model.pickerModel.value,
                            caption: 'The applied selection, exactly as it persists.',
                            config: fmtDemoConfig<DateRangePickerProps>('dateRangePicker', {
                                model: raw('pickerModel'),
                                styleButtonAsInput: model.styleButtonAsInput ? undefined : false,
                                showRange: model.showRange ? undefined : false,
                                showStepButtons: model.showStepButtons || undefined,
                                footerNote: model.showFooterNote ? undefined : null,
                                intent: model.intent || undefined
                            }),
                            item: dateRangePicker({
                                model: model.pickerModel,
                                styleButtonAsInput: model.styleButtonAsInput,
                                showRange: model.showRange,
                                showStepButtons: model.showStepButtons,
                                intent: model.intent,
                                footerNote: model.showFooterNote ? undefined : null,
                                testId: 'drp'
                            })
                        })
                    }),
                    demoSection({
                        title: 'Model Values',
                        note: 'Everything the model derives from the applied selection.',
                        item: modelValues()
                    }),
                    demoSection({
                        title: 'Variants',
                        note: 'Each card sets its own props.',
                        item: demoGrid({
                            columns: 3,
                            items: [variantNarrow(), variantMonth(), variantFiscal()]
                        })
                    })
                ]
            })
        });
    }
});

//------------------------------------------------------------------
// Model values
//------------------------------------------------------------------
const modelValues = hoistCmp.factory<DateRangePickerPanelModel>(({model}) => {
    const {pickerModel: m} = model,
        fmtRange = (r: LocalDateRange) => (r ? m.fmtRange(r) : 'null'),
        rows: Array<[string, string]> = [
            ['value', JSON.stringify(m.value)],
            ['label', m.label],
            ['rangeLabel', m.rangeLabel],
            ['displayName', m.displayName],
            ['currentRange', fmtRange(m.currentRange)],
            ['priorRange', fmtRange(m.priorRange)],
            ['anchorDay', JSON.stringify(m.anchorDay)],
            ['anchorDate', m.anchorDate.isoString],
            ['today', m.today.isoString],
            ['currentRangeFilter', JSON.stringify(m.currentRangeFilter)]
        ];
    return demoGrid({
        columns: 2,
        items: rows.map(([label, value]) =>
            demoRow({
                key: label,
                label,
                item: code({className: 'tb-drp-panel__value', item: value})
            })
        )
    });
});

//------------------------------------------------------------------
// Other configurations
//------------------------------------------------------------------
const variantNarrow = hoistCmp.factory<DateRangePickerPanelModel>(({model}) =>
    demoRow({
        label: 'Stretched into a narrow host',
        info: 'flex: 1 - the trigger measures its width and drops the dates when they no longer fit.',
        item: box({
            className: 'tb-drp-panel__narrow-host',
            width: 200,
            item: dateRangePicker({model: model.pickerModel, flex: 1, testId: 'drp-narrow'})
        })
    })
);

const variantMonth = hoistCmp.factory<DateRangePickerPanelModel>(({model}) =>
    demoRow({
        label: 'Single tab - months and years only',
        info: "tabs: ['period'] - no rail, and the popover shrinks to fit.",
        item: dateRangePicker({model: model.monthPickerModel, testId: 'drp-month'})
    })
);

const variantFiscal = hoistCmp.factory<DateRangePickerPanelModel>(({model}) =>
    demoRow({
        label: 'App-defined presets, outlined trigger',
        info: 'A fiscal-year preset alongside built-ins, presets + custom tabs, styleButtonAsInput: false.',
        item: dateRangePicker({
            model: model.fiscalPickerModel,
            styleButtonAsInput: false,
            buttonProps: {icon: Icon.chartLine()},
            testId: 'drp-fiscal'
        })
    })
);

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
class DateRangePickerPanelModel extends HoistModel {
    @managed pickerModel: DateRangePickerModel;
    @managed monthPickerModel: DateRangePickerModel;
    @managed fiscalPickerModel: DateRangePickerModel;

    // Component options
    @bindable styleButtonAsInput = true;
    @bindable showRange = true;
    @bindable showStepButtons = true;
    @bindable showFooterNote = true;
    @bindable intent: Intent = null;

    // Model options
    @bindable.ref tabs: DateRangePickerTab[] = [...DATE_RANGE_PICKER_TABS];
    // The defaults plus Prev Day, so the demo shows a single-day walk from both presets.
    @bindable.ref presets: DateRangePresetToken[] = sortBy(
        [...DEFAULT_DATE_RANGE_PRESETS, 'prevDay'],
        it => DATE_RANGE_PRESET_TOKENS.indexOf(it)
    );
    @bindable anchorMode: 'localDay' | 'appDay' | 'pinned' = 'localDay';
    @bindable.ref anchorDate: LocalDate = LocalDate.today();
    @bindable.ref maxDate: LocalDate = null;
    @bindable dateFormat = 'YYYY-MM-DD';
    @bindable singleDayFormat: keyof typeof DAY_FORMATS = 'ddd MMM D';

    constructor() {
        super();
        makeObservable(this);

        this.pickerModel = new DateRangePickerModel({
            filterField: 'date',
            // Weekdays less a few fixed-date holidays - the calendar behind `businessDayMode`.
            isBusinessDay: d => d.isWeekday && !FIXED_HOLIDAYS.includes(d.format('MM-DD')),
            persistWith: {localStorageKey: 'toolboxDateRangePicker'}
        });

        this.monthPickerModel = new DateRangePickerModel({
            tabs: ['period'],
            initialValue: {kind: 'month', year: LocalDate.today().moment.year(), month: 1}
        });

        this.fiscalPickerModel = new DateRangePickerModel({
            tabs: ['presets', 'custom'],
            presets: [FISCAL_YTD, PREV_FISCAL_YEAR, 'qtd', 'ytd', 'prev90Days'],
            initialValue: 'fytd'
        });

        this.addReaction(
            {
                // The picker allows clearing every tab - hold the last configuration until one is
                // selected again, as the model requires at least one.
                track: () => this.tabs,
                run: tabs => {
                    if (isEmpty(tabs)) return;
                    // As with presets below - catalog order, not pick order.
                    this.pickerModel.setTabs(
                        sortBy(tabs, it => DATE_RANGE_PICKER_TABS.indexOf(it))
                    );
                }
            },
            {
                // The picker appends in pick order - present presets in their catalog order instead.
                track: () => this.presets,
                run: presets =>
                    this.pickerModel.setPresets(
                        sortBy(presets, it => DATE_RANGE_PRESET_TOKENS.indexOf(it))
                    )
            },
            // These options have their own defaults on this model - apply them at once, so the
            // picker starts where the options say rather than at its own defaults.
            {
                track: () => this.dateFormat,
                run: fmt => (this.pickerModel.dateFormat = fmt),
                fireImmediately: true
            },
            {
                track: () => this.singleDayFormat,
                run: key => (this.pickerModel.singleDayFormat = DAY_FORMATS[key]),
                fireImmediately: true
            },
            {
                // The pinned date input can be cleared - the model requires a date, so fall back
                // to today until one is entered.
                track: () => [this.anchorMode, this.anchorDate],
                run: () => {
                    const {anchorMode, anchorDate} = this;
                    this.pickerModel.setAnchorDay(
                        anchorMode === 'pinned' ? (anchorDate ?? LocalDate.today()) : anchorMode
                    );
                },
                fireImmediately: true
            },
            {track: () => this.maxDate, run: maxDate => this.pickerModel.setMaxDate(maxDate)}
        );
    }
}

/** Day formats offered by the demo - strings, plus a function that adds the year only when needed. */
const DAY_FORMATS: Record<string, DateRangeFormat> = {
    'ddd MMM D': 'ddd MMM D',
    'ddd MMM D, YYYY': 'ddd MMM D, YYYY',
    'YYYY-MM-DD': 'YYYY-MM-DD',
    'Year if not current': d =>
        d.format(
            d.moment.year() === LocalDate.today().moment.year() ? 'ddd MMM D' : 'ddd MMM D, YYYY'
        )
};

/** New Year's Day, Independence Day, and Christmas - enough to show `isBusinessDay` in action. */
const FIXED_HOLIDAYS = ['01-01', '07-04', '12-25'];

//------------------------------------------------------------------
// App-defined presets - a July 1 fiscal year
//------------------------------------------------------------------
const fiscalYearStart = (date: LocalDate): LocalDate => {
    const start = LocalDate.get(`${date.moment.year()}-07-01`);
    return start <= date ? start : start.subtract(1, 'years');
};

const FISCAL_YTD: DateRangePreset = {
    token: 'fytd',
    label: 'FYTD',
    name: 'Fiscal Year to Date (from Jul 1)',
    resolve: ({anchorDate}) => ({start: fiscalYearStart(anchorDate), end: anchorDate}),
    resolvePrior: ({start, end}) => ({
        start: start.subtract(1, 'years'),
        end: end.subtract(1, 'years')
    })
};

const PREV_FISCAL_YEAR: DateRangePreset = {
    token: 'prevFy',
    label: ({anchorDate}) => `FY${fiscalYearStart(anchorDate).format('YY')}`,
    name: ({anchorDate}) => `Prev Fiscal Year (FY${fiscalYearStart(anchorDate).format('YY')})`,
    resolve: ({anchorDate}) => {
        const end = fiscalYearStart(anchorDate).previousDay();
        return {start: end.add(1, 'days').subtract(1, 'years'), end};
    }
};
