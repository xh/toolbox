import {grid, GridModel, localDateCol, numberCol} from '@xh/hoist/cmp/grid';
import {box, code, div, filler, hbox, hframe, span, vbox, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, type Intent, managed} from '@xh/hoist/core';
import {parseFilter} from '@xh/hoist/data';
import {
    DATE_RANGE_PICKER_TABS,
    DATE_RANGE_PRESET_TOKENS,
    dateRangePicker,
    type DateRangeFormat,
    DateRangePickerModel,
    type DateRangePickerTab,
    type DateRangePreset,
    type DateRangePresetToken,
    DEFAULT_DATE_RANGE_PRESETS,
    type LocalDateRange
} from '@xh/hoist/desktop/cmp/daterange';
import {dateInput, picker, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {fmtNumber} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, computed, makeObservable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {isEmpty, sortBy} from 'lodash';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../common';
import './DateRangePickerPanel.scss';

export const dateRangePickerPanel = hoistCmp.factory({
    displayName: 'DateRangePickerPanel',
    model: creates(() => DateRangePickerPanelModel),

    render({model}) {
        return wrapper({
            title: 'DateRangePicker',
            icon: Icon.calendarRange(),
            description: [
                '`DateRangePicker` is a dropdown control for selecting a period of time - one compact',
                'trigger that can express presets (MTD, Prev 30 Days, ...), relative lookbacks, calendar',
                'months and years, and custom ranges of dates. Its popover offers a tab for each of those',
                'selection shapes, and the backing model controls which tabs and presets appear.',
                '',
                'The applied value is a single `DateRangeSelection` - plain JSON that persists as-is and',
                're-resolves as the anchor day moves, so a saved `mtd` stays month-to-date. The step',
                'buttons (and arrow keys on the trigger) walk a preset or lookback back and forth',
                'without changing what it is - stepped ranges keep rolling with the day. The',
                '`DateRangePickerModel` resolves it to current and prior `LocalDateRange`s and to',
                '`FieldFilterSpec`s ready to apply to a Store or query. The grid here is filtered by',
                "the picker's `currentRangeFilter`, with the prior range summarized for comparison.",
                '',
                'Use the options to reconfigure the main picker in the toolbar. The smaller examples',
                'below the readout show a stretched trigger adapting to a narrow host, a single-tab',
                'month picker, and a picker with app-defined presets.'
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
                            control: select({
                                bind: 'intent',
                                enableClear: true,
                                enableFilter: false,
                                placeholder: 'None',
                                width: 120,
                                options: ['primary', 'success', 'warning', 'danger']
                            })
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
                            label: 'Allow future dates',
                            propName: 'DateRangePickerConfig.maxDate',
                            info: 'Sets maxDate one year past the anchor. Off, nothing beyond the anchor is selectable.',
                            control: switchInput({bind: 'allowFutureDates'})
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
                            label: 'Day format',
                            propName: 'DateRangePickerConfig.dayFormat',
                            info: 'For a single day, and the anchor date in the footer. The last option is a function that adds the year only outside the current one.',
                            control: select({
                                bind: 'dayFormat',
                                enableFilter: false,
                                width: 150,
                                options: Object.keys(DAY_FORMATS)
                            })
                        })
                    ]
                })
            ],
            item: panel({
                className: 'tb-drp-panel',
                width: '100%',
                height: '100%',
                maxWidth: 1400,
                tbar: mainToolbar(),
                item: hframe(
                    vframe({className: 'tb-drp-panel__side', items: [readout(), variants()]}),
                    grid({model: model.gridModel})
                )
            })
        });
    }
});

//------------------------------------------------------------------
// Main picker + filtered grid stats
//------------------------------------------------------------------
const mainToolbar = hoistCmp.factory<DateRangePickerPanelModel>(({model}) => {
    const {pickerModel, stats} = model;
    return toolbar(
        dateRangePicker({
            model: pickerModel,
            styleButtonAsInput: model.styleButtonAsInput,
            showRange: model.showRange,
            showStepButtons: model.showStepButtons,
            intent: model.intent,
            footerNote: model.showFooterNote ? undefined : null,
            testId: 'drp'
        }),
        filler(),
        statBlock({label: 'Current', stat: stats.current}),
        toolbarSep(),
        statBlock({label: 'Prior', stat: stats.prior})
    );
});

interface RangeStat {
    count: number;
    total: number;
}

const statBlock = hoistCmp.factory<DateRangePickerPanelModel>(({label, stat}) =>
    hbox({
        className: 'tb-drp-panel__stat',
        items: [
            span({className: 'tb-drp-panel__stat-label', item: label}),
            stat
                ? span(
                      `${fmtNumber(stat.count, {precision: 0})} days · ${fmtNumber(stat.total, {
                          precision: 0,
                          prefix: '$'
                      })}`
                  )
                : span({className: 'xh-text-color-muted', item: 'n/a'})
        ]
    })
);

//------------------------------------------------------------------
// Readout of the model's derived values
//------------------------------------------------------------------
const readout = hoistCmp.factory<DateRangePickerPanelModel>(({model}) => {
    const {pickerModel: m} = model,
        fmtRange = (r: LocalDateRange) => (r ? m.fmtRange(r) : 'null');
    return panel({
        title: 'DateRangePickerModel',
        icon: Icon.code(),
        compactHeader: true,
        className: 'tb-drp-panel__readout',
        items: [
            readoutRow({label: 'value', value: JSON.stringify(m.value)}),
            readoutRow({label: 'label', value: m.label}),
            readoutRow({label: 'rangeLabel', value: m.rangeLabel}),
            readoutRow({label: 'displayName', value: m.displayName}),
            readoutRow({label: 'currentRange', value: fmtRange(m.currentRange)}),
            readoutRow({label: 'priorRange', value: fmtRange(m.priorRange)}),
            readoutRow({label: 'anchorDay', value: JSON.stringify(m.anchorDay)}),
            readoutRow({label: 'anchorDate', value: m.anchorDate.isoString}),
            readoutRow({label: 'today', value: m.today.isoString}),
            readoutRow({
                label: 'currentRangeFilter',
                value: JSON.stringify(m.currentRangeFilter)
            })
        ]
    });
});

const readoutRow = hoistCmp.factory(({label, value}) =>
    div({
        className: 'tb-drp-panel__readout-row',
        items: [
            span({className: 'tb-drp-panel__readout-label', item: label}),
            code({className: 'tb-drp-panel__readout-value', item: value})
        ]
    })
);

//------------------------------------------------------------------
// Other configurations
//------------------------------------------------------------------
const variants = hoistCmp.factory<DateRangePickerPanelModel>(({model}) =>
    panel({
        title: 'Other Configurations',
        icon: Icon.gears(),
        compactHeader: true,
        className: 'tb-drp-panel__variants',
        items: [
            variantRow({
                label: 'Stretched into a narrow host',
                info: 'flex: 1 - the trigger measures its width and drops the dates when they no longer fit.',
                item: box({
                    className: 'tb-drp-panel__narrow-host',
                    width: 200,
                    item: dateRangePicker({model: model.pickerModel, flex: 1, testId: 'drp-narrow'})
                })
            }),
            variantRow({
                label: 'Single tab - months and years only',
                info: "tabs: ['monthYear'] - no rail, and the popover shrinks to fit.",
                item: dateRangePicker({model: model.monthPickerModel, testId: 'drp-month'})
            }),
            variantRow({
                label: 'App-defined presets, outlined trigger',
                info: 'A fiscal-year preset alongside built-ins, presets + custom tabs, styleButtonAsInput: false.',
                item: dateRangePicker({
                    model: model.fiscalPickerModel,
                    styleButtonAsInput: false,
                    buttonProps: {icon: Icon.chartLine()},
                    testId: 'drp-fiscal'
                })
            })
        ]
    })
);

const variantRow = hoistCmp.factory(({label, info, children}) =>
    vbox({
        className: 'tb-drp-panel__variant',
        items: [
            span({className: 'tb-drp-panel__variant-label', item: label}),
            span({className: 'xh-text-color-muted xh-font-size-small', item: info}),
            div({className: 'tb-drp-panel__variant-body', item: children})
        ]
    })
);

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
class DateRangePickerPanelModel extends HoistModel {
    @managed pickerModel: DateRangePickerModel;
    @managed monthPickerModel: DateRangePickerModel;
    @managed fiscalPickerModel: DateRangePickerModel;
    @managed gridModel: GridModel;

    // Component options
    @bindable styleButtonAsInput = true;
    @bindable showRange = true;
    @bindable showStepButtons = true;
    @bindable showFooterNote = true;
    @bindable intent: Intent = null;

    // Model options
    @bindable.ref tabs: DateRangePickerTab[] = [...DATE_RANGE_PICKER_TABS];
    @bindable.ref presets: DateRangePresetToken[] = [...DEFAULT_DATE_RANGE_PRESETS];
    @bindable anchorMode: 'localDay' | 'appDay' | 'pinned' = 'localDay';
    @bindable.ref anchorDate: LocalDate = LocalDate.today();
    @bindable allowFutureDates = false;
    @bindable dateFormat = 'YYYY-MM-DD';
    @bindable dayFormat: keyof typeof DAY_FORMATS = 'ddd MMM D';

    /** Record counts and totals within the current and prior ranges, across all loaded data. */
    @computed
    get stats(): {current: RangeStat; prior: RangeStat} {
        const {pickerModel, gridModel} = this,
            records = gridModel.store.allRecords,
            statFor = (range: LocalDateRange): RangeStat => {
                if (!range) return null;
                const specs = pickerModel.getRangeFilter(range),
                    testFn = isEmpty(specs) ? null : parseFilter(specs).getTestFn(gridModel.store),
                    matches = testFn ? records.filter(testFn) : records;
                return {
                    count: matches.length,
                    total: matches.reduce((sum, r) => sum + r.data.amount, 0)
                };
            };
        return {current: statFor(pickerModel.currentRange), prior: statFor(pickerModel.priorRange)};
    }

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
            tabs: ['monthYear'],
            initialValue: {kind: 'month', year: LocalDate.today().moment.year(), month: 1}
        });

        this.fiscalPickerModel = new DateRangePickerModel({
            tabs: ['presets', 'custom'],
            presets: [FISCAL_YTD, LAST_FISCAL_YEAR, 'qtd', 'ytd', 'prev90Days'],
            initialValue: 'fytd'
        });

        this.gridModel = new GridModel({
            xhName: 'dateRangePickerDemo',
            store: {
                fields: [
                    {name: 'date', type: 'localDate'},
                    {name: 'category', type: 'string'},
                    {name: 'amount', type: 'number'}
                ]
            },
            sortBy: 'date|desc',
            emptyText: 'No records within the selected range.',
            columns: [
                {field: 'date', ...localDateCol},
                {field: 'category', width: 120},
                {
                    field: 'amount',
                    ...numberCol,
                    width: 110,
                    renderer: v => fmtNumber(v, {precision: 0, prefix: '$'})
                },
                {colId: 'spacer', flex: 1, headerName: '', sortable: false, resizable: false}
            ]
        });
        this.gridModel.loadData(generateRecords());

        this.addReaction(
            {
                track: () => this.pickerModel.currentRangeFilter,
                run: filter => this.gridModel.store.setFilter(filter),
                fireImmediately: true
            },
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
                track: () => this.dayFormat,
                run: key => (this.pickerModel.dayFormat = DAY_FORMATS[key]),
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
            {
                track: () => [this.allowFutureDates, this.pickerModel.anchorDate],
                run: () => {
                    const {allowFutureDates, pickerModel} = this;
                    pickerModel.setMaxDate(
                        allowFutureDates ? pickerModel.anchorDate.add(1, 'years') : null
                    );
                }
            }
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

const LAST_FISCAL_YEAR: DateRangePreset = {
    token: 'lastFy',
    label: ({anchorDate}) => `FY${fiscalYearStart(anchorDate).format('YY')}`,
    name: ({anchorDate}) => `Last Fiscal Year (FY${fiscalYearStart(anchorDate).format('YY')})`,
    resolve: ({anchorDate}) => {
        const end = fiscalYearStart(anchorDate).previousDay();
        return {start: end.add(1, 'days').subtract(1, 'years'), end};
    }
};

//------------------------------------------------------------------
// Sample data - one record per day, deterministic
//------------------------------------------------------------------
const CATEGORIES = ['Sales', 'Service', 'Support', 'Licensing'];

function generateRecords() {
    const start = LocalDate.today().subtract(3, 'years').startOfYear(),
        end = LocalDate.today().add(1, 'years'),
        ret = [];
    for (let day = start, i = 0; day <= end; day = day.nextDay(), i++) {
        ret.push({
            id: day.isoString,
            date: day,
            category: CATEGORIES[(i * 7) % CATEGORIES.length],
            amount: 250 + ((i * 7919) % 1750)
        });
    }
    return ret;
}
