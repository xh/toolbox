import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {div, span} from '@xh/hoist/cmp/layout';
import type {SparklineProps} from '@xh/hoist/cmp/sparkline';
import {sparkline} from '@xh/hoist/cmp/sparkline';
import {statCard, statCardStrip} from '@xh/hoist/cmp/statcard';
import type {Intent, LoadSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {numberInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {fmtMillions, fmtNumber, fmtPercent, numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, bindableRef} from '@xh/hoist/mobx';
import {first, last, map, min, take, takeRight} from 'lodash';
import {
    demoFrame,
    demoGrid,
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    fmtDemoConfig,
    raw
} from '../../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import './SparklinePanel.scss';

const UP = [101, 103, 102, 106, 109, 107, 113, 111, 116, 118],
    DOWN = [118, 116, 117, 112, 113, 108, 109, 104, 105, 101],
    DAILY_PNL = [12, 18, -6, 9, -14, -3, 21, 7, -9, 15, 4, -11],
    ORDERS_BY_DAY = [310, 342, 298, 365, 401, 388, 420, 395, 441, 467, 452, 498, 510, 487];

export const sparklinePanel = hoistCmp.factory({
    displayName: 'SparklinePanel',
    model: creates(() => SparklinePanelModel),

    render({model}) {
        const {lineProps, stretch} = model;
        return wrapper({
            title: 'Sparkline',
            icon: Icon.chartLine(),
            description: [
                'A `Sparkline` is a small inline chart of a trend, with no axes or labels - the',
                'line beside a key figure, or the trend cell in a grid row.',
                '',
                'It draws plain SVG from an array of numbers, as a `line`, an `area` or a `bar`',
                'series. It renders inline at a small fixed size by default. Layout props stretch',
                'it to its container, and the line keeps its thickness.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/components/general/SparklinePanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/README.md#sparkline-sparkline',
                    text: 'Sparkline docs',
                    notes: 'Usage in a StatCard and a grid column.'
                },
                {url: '$HR/cmp/sparkline/Sparkline.ts', notes: 'Hoist component.'},
                {url: '$HR/cmp/sparkline/Sparkline.scss', notes: 'Styles and CSS variables.'}
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground',
                    info: 'Drives the Playground sparkline.',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    items: [
                        wrapperOption({
                            label: 'Type',
                            propName: 'SparklineProps.type',
                            control: select({
                                bind: 'type',
                                enableFilter: false,
                                enableClear: true,
                                width: 110,
                                options: ['line', 'area', 'bar']
                            })
                        }),
                        wrapperOption({
                            label: 'Series',
                            info: 'The values to draw.',
                            control: select({
                                bind: 'series',
                                enableFilter: false,
                                width: 110,
                                options: ['up', 'down', 'pnl']
                            })
                        }),
                        wrapperOption({
                            label: 'Intent',
                            propName: 'SparklineProps.intent',
                            control: select({
                                bind: 'intent',
                                enableFilter: false,
                                enableClear: true,
                                width: 110,
                                options: ['primary', 'success', 'warning', 'danger']
                            })
                        }),
                        switchOption('Color by trend', 'colorByTrend'),
                        switchOption('Color negative', 'colorNegative'),
                        switchOption('Show last', 'showLast'),
                        switchOption('Show min and max', 'showMinMax'),
                        wrapperOption({
                            label: 'Baseline',
                            propName: 'SparklineProps.baseline',
                            info: 'Empty for no line.',
                            control: numberInput({bind: 'baseline', width: 70})
                        }),
                        switchOption('Tooltip', 'tooltip'),
                        wrapperOption({
                            label: 'Stretch',
                            info: "width: '100%', height: 60",
                            control: switchInput({bind: 'stretch'})
                        })
                    ]
                })
            ],
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 300,
                            showValue: false,
                            caption: 'At its default size of 80 by 24 pixels, unless stretched.',
                            config: fmtDemoConfig<SparklineProps>('sparkline', {
                                values: raw('values'),
                                ...lineProps,
                                width: stretch ? '100%' : undefined,
                                height: stretch ? 60 : undefined
                            }),
                            item: sparkline({
                                values: model.values,
                                ...lineProps,
                                width: stretch ? '100%' : undefined,
                                height: stretch ? 60 : undefined
                            })
                        })
                    }),
                    demoSection({
                        title: 'Types',
                        note: 'At the default size, and at 200 by 48.',
                        item: demoGrid({
                            items: (['line', 'area', 'bar'] as const).map(type =>
                                demoRow({
                                    key: type,
                                    label: type,
                                    items: [
                                        sparkline({values: UP, type}),
                                        div({
                                            style: {marginTop: 8},
                                            item: sparkline({
                                                values: UP,
                                                type,
                                                width: 200,
                                                height: 48
                                            })
                                        })
                                    ]
                                })
                            )
                        })
                    }),
                    demoSection({
                        title: 'Color',
                        note: 'The neutral default, each intent, the trend, and a CSS color.',
                        item: div({
                            className: 'tb-sparkline-panel__row',
                            items: [
                                labeled('default', sparkline({values: UP})),
                                ...(['primary', 'success', 'warning', 'danger'] as Intent[]).map(
                                    intent =>
                                        labeled(
                                            intent,
                                            sparkline({values: UP, intent, type: 'area'})
                                        )
                                ),
                                labeled('trend up', sparkline({values: UP, colorByTrend: true})),
                                labeled(
                                    'trend down',
                                    sparkline({values: DOWN, colorByTrend: true})
                                ),
                                labeled(
                                    'CSS color',
                                    sparkline({
                                        values: UP,
                                        className: 'tb-sparkline-panel__orange'
                                    })
                                )
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Marks',
                        note: 'showLast, showMinMax and a baseline, at 160 by 40.',
                        item: div({
                            className: 'tb-sparkline-panel__row',
                            items: [
                                labeled(
                                    'showLast',
                                    sparkline({values: UP, showLast: true, ...MID})
                                ),
                                labeled(
                                    'showMinMax',
                                    sparkline({values: DOWN, showMinMax: true, ...MID})
                                ),
                                labeled(
                                    'both, by trend',
                                    sparkline({
                                        values: UP,
                                        showLast: true,
                                        showMinMax: true,
                                        colorByTrend: true,
                                        type: 'area',
                                        ...MID
                                    })
                                ),
                                labeled(
                                    'baseline: 105',
                                    sparkline({values: UP, baseline: 105, ...MID})
                                ),
                                labeled(
                                    'baseline off the series',
                                    sparkline({values: UP, baseline: 90, showLast: true, ...MID})
                                )
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Bars',
                        note: 'Bars grow from zero, or from a baseline.',
                        item: div({
                            className: 'tb-sparkline-panel__row',
                            items: [
                                labeled(
                                    'colorNegative, baseline: 0',
                                    sparkline({
                                        values: DAILY_PNL,
                                        type: 'bar',
                                        colorNegative: true,
                                        baseline: 0,
                                        ...MID
                                    })
                                ),
                                labeled(
                                    'far from zero',
                                    sparkline({values: UP, type: 'bar', ...MID})
                                ),
                                labeled(
                                    'min: 100',
                                    sparkline({values: UP, type: 'bar', min: 100, ...MID})
                                ),
                                labeled(
                                    'baseline: 108',
                                    sparkline({
                                        values: UP,
                                        type: 'bar',
                                        baseline: 108,
                                        colorNegative: true,
                                        ...MID
                                    })
                                ),
                                labeled(
                                    '60 bars',
                                    sparkline({
                                        values: Array.from({length: 60}, (_, i) =>
                                            Math.round(50 + 40 * Math.sin(i / 5))
                                        ),
                                        type: 'bar',
                                        ...MID
                                    })
                                )
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Sizing',
                        note: "Inline in text, and stretched with width: '100%'.",
                        items: [
                            div({
                                items: [
                                    'Volume rose through the week ',
                                    sparkline({values: UP, colorByTrend: true, showLast: true}),
                                    ' and closed at a high.'
                                ]
                            }),
                            demoGrid({
                                columns: 2,
                                items: [
                                    demoFrame({
                                        label: 'Stretched line',
                                        info: "width: '100%', height: 60",
                                        item: sparkline({
                                            values: model.longSeries,
                                            width: '100%',
                                            height: 60,
                                            showLast: true,
                                            showMinMax: true
                                        })
                                    }),
                                    demoFrame({
                                        label: 'Stretched bars',
                                        info: "width: '100%', height: 60",
                                        item: sparkline({
                                            values: DAILY_PNL,
                                            type: 'bar',
                                            colorNegative: true,
                                            baseline: 0,
                                            width: '100%',
                                            height: 60
                                        })
                                    })
                                ]
                            })
                        ]
                    }),
                    demoSection({
                        title: 'In a StatCard',
                        note: 'As the detail under a figure, and as the subValue beside it.',
                        item: statCardStrip(
                            statCard({
                                title: 'Orders',
                                value: fmtNumber(last(ORDERS_BY_DAY), {precision: 0}),
                                detail: sparkline({
                                    values: ORDERS_BY_DAY,
                                    type: 'area',
                                    intent: 'primary',
                                    width: '100%',
                                    domAttrs: {'aria-label': 'Orders per day, last 14 days'}
                                })
                            }),
                            statCard({
                                title: 'Daily P&L',
                                value: fmtNumber(last(DAILY_PNL), {
                                    precision: 0,
                                    label: 'k',
                                    colorSpec: true
                                }),
                                detail: sparkline({
                                    values: DAILY_PNL,
                                    type: 'bar',
                                    colorNegative: true,
                                    baseline: 0,
                                    width: '100%',
                                    height: 32
                                })
                            }),
                            statCard({
                                title: 'Revenue',
                                value: fmtMillions(2483960, {precision: 2, label: true}),
                                subValue: sparkline({
                                    values: UP,
                                    colorByTrend: true,
                                    showLast: true
                                }),
                                detail: 'vs. last month, 42 locations'
                            }),
                            statCard({
                                title: 'Returns',
                                value: fmtNumber(87412, {precision: 0}),
                                subValue: fmtPercent(0.093, {precision: 1, withSignGlyph: true}),
                                detail: sparkline({
                                    values: DOWN,
                                    colorByTrend: true,
                                    width: '100%',
                                    showMinMax: true
                                })
                            })
                        )
                    }),
                    demoSection({
                        title: 'In a Grid Column',
                        note: 'Closing prices of the sample portfolio. Each row scales to itself.',
                        item: div({
                            className: 'tb-sparkline-panel__grid',
                            item: grid()
                        })
                    }),
                    demoSection({
                        title: 'One Scale',
                        note: 'min and max put several sparklines on one scale.',
                        item: demoGrid({
                            columns: 2,
                            items: [
                                demoFrame({
                                    label: 'Own scale',
                                    info: 'Each looks the same height',
                                    item: scaleRows()
                                }),
                                demoFrame({
                                    label: 'Shared scale',
                                    info: 'min: 0, max: 120',
                                    item: scaleRows({min: 0, max: 120})
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Gaps and Partial Data',
                        note: 'A sparkline never fails on odd data.',
                        item: div({
                            className: 'tb-sparkline-panel__row',
                            items: [
                                labeled(
                                    'gaps',
                                    sparkline({values: [3, 5, null, null, 6, 8, NaN, 7, 9], ...MID})
                                ),
                                labeled(
                                    'gaps, bars',
                                    sparkline({
                                        values: [3, 5, null, null, 6, 8, NaN, 7, 9],
                                        type: 'bar',
                                        ...MID
                                    })
                                ),
                                labeled('one value', sparkline({values: [5], ...MID})),
                                labeled('all the same', sparkline({values: [4, 4, 4, 4], ...MID})),
                                labeled('empty', sparkline({values: [], ...MID})),
                                labeled('null', sparkline({values: null, ...MID}))
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Restyled with CSS Variables',
                        note: 'A thick line, large dots and a strong area fill.',
                        item: demoFrame({
                            className: 'tb-sparkline-panel__restyled',
                            item: sparkline({
                                values: UP,
                                type: 'area',
                                intent: 'primary',
                                showLast: true,
                                showMinMax: true,
                                width: 320,
                                height: 64
                            })
                        })
                    })
                ]
            })
        });
    }
});

const MID = {width: 160, height: 40};

function labeled(label: string, item: ReturnType<typeof sparkline>) {
    return div({
        key: label,
        className: 'tb-sparkline-panel__labeled',
        items: [item, span(label)]
    });
}

function switchOption(label: string, bind: keyof SparklinePanelModel & string) {
    return wrapperOption({
        label,
        propName: `SparklineProps.${bind}`,
        control: switchInput({bind})
    });
}

/** Three series of different ranges, each on its own scale or on the one given. */
function scaleRows(scale: Pick<SparklineProps, 'min' | 'max'> = {}) {
    const rows: Array<[string, number[]]> = [
        ['Small', [8, 10, 9, 12, 11, 14]],
        ['Medium', [40, 46, 43, 52, 49, 58]],
        ['Large', [90, 101, 96, 112, 108, 118]]
    ];
    return div({
        className: 'tb-sparkline-panel__scale-rows',
        items: rows.map(([label, values]) =>
            div({
                key: label,
                items: [
                    span(label),
                    sparkline({values, type: 'area', width: 200, height: 48, ...scale})
                ]
            })
        )
    });
}

class SparklinePanelModel extends HoistModel {
    @bindable accessor type: SparklineProps['type'] = null;
    @bindable accessor series: 'up' | 'down' | 'pnl' = 'up';
    @bindable accessor intent: Intent = null;
    @bindable accessor colorByTrend = false;
    @bindable accessor colorNegative = false;
    @bindable accessor showLast = false;
    @bindable accessor showMinMax = false;
    @bindable accessor baseline: number = null;
    @bindable accessor tooltip = false;
    @bindable accessor stretch = false;

    @bindableRef accessor longSeries: number[] = [];

    @managed gridModel = new GridModel({
        store: {idSpec: 'symbol'},
        sortBy: 'symbol',
        emptyText: 'No price history.',
        columns: [
            {field: 'symbol', width: 90},
            {
                field: {name: 'last', type: 'number'},
                width: 90,
                align: 'right',
                renderer: numberRenderer({precision: 2})
            },
            {
                field: {name: 'change', type: 'number'},
                headerName: 'Chg',
                width: 90,
                align: 'right',
                renderer: numberRenderer({
                    precision: 1,
                    colorSpec: true,
                    withSignGlyph: true
                })
            },
            {
                field: 'history',
                headerName: 'Trend, 30 days',
                width: 150,
                autosizable: false,
                sortable: false,
                excludeFromExport: true,
                renderer: values => sparkline({values, width: '100%', colorByTrend: true})
            },
            {
                field: 'volumeBars',
                headerName: 'As bars',
                width: 150,
                autosizable: false,
                sortable: false,
                excludeFromExport: true,
                renderer: values =>
                    sparkline({values, type: 'bar', width: '100%', min: min(values as number[])})
            },
            {
                field: 'year',
                headerName: 'One year, flex',
                flex: 1,
                minWidth: 120,
                autosizable: false,
                sortable: false,
                excludeFromExport: true,
                renderer: values =>
                    sparkline({
                        values,
                        type: 'area',
                        width: '100%',
                        showLast: true,
                        showMinMax: true
                    })
            }
        ]
    });

    get values(): number[] {
        return {up: UP, down: DOWN, pnl: DAILY_PNL}[this.series];
    }

    /**
     * Props for the Playground sparkline, less its values and size. Options left off resolve to
     * undefined, so the snippet omits them. The snippet reads this same getter, so the code shown
     * cannot drift from the sparkline beside it.
     */
    get lineProps(): PlaygroundLineProps {
        const {type, intent, colorByTrend, colorNegative, showLast, showMinMax, baseline, tooltip} =
            this;
        return {
            type: type ?? undefined,
            intent: intent ?? undefined,
            colorByTrend: colorByTrend || undefined,
            colorNegative: colorNegative || undefined,
            showLast: showLast || undefined,
            showMinMax: showMinMax || undefined,
            baseline: baseline ?? undefined,
            tooltip: tooltip || undefined
        };
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {portfolioService} = XH,
            symbols: string[] = take(await portfolioService.getSymbolsAsync({loadSpec}), 8),
            history = await portfolioService.getSparklineSeriesAsync(symbols, {loadSpec}),
            rows = map(history, (series: Array<[Date, number]>, symbol) => {
                const prices = series.map(([, price]) => price),
                    month = takeRight(prices, 30);
                return {
                    symbol,
                    last: last(month),
                    change: ((last(month) - first(month)) / first(month)) * 100,
                    history: month,
                    volumeBars: takeRight(prices, 12),
                    year: takeRight(prices, 250)
                };
            });

        this.gridModel.loadData(rows);
        this.longSeries = rows[0]?.year ?? [];
    }
}

/** The Sparkline props the rail drives, as the plain values its inputs produce. */
interface PlaygroundLineProps {
    type?: SparklineProps['type'];
    intent?: Intent;
    colorByTrend?: boolean;
    colorNegative?: boolean;
    showLast?: boolean;
    showMinMax?: boolean;
    baseline?: number;
    tooltip?: boolean;
}
