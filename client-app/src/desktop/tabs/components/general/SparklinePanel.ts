import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {div, span} from '@xh/hoist/cmp/layout';
import type {SparklineMarker, SparklineProps} from '@xh/hoist/cmp/sparkline';
import {sparkline} from '@xh/hoist/cmp/sparkline';
import {statCard, statCardStrip} from '@xh/hoist/cmp/statcard';
import type {Intent, LoadSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {numberInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {fmtMillions, fmtNumber, fmtPercent, numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, bindableRef} from '@xh/hoist/mobx';
import {first, isFinite, last, map, max, min, take, takeRight} from 'lodash';
import type {ReactElement, ReactNode} from 'react';
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
import {closingPriceAgSparklineCol} from '../../../../core/columns/Orders';
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
        const {lineProps, markers, tooltip, stretch} = model;
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
                        wrapperOption({
                            label: 'Markers',
                            propName: 'SparklineProps.markers',
                            control: select({
                                bind: 'markers',
                                enableMulti: true,
                                enableFilter: false,
                                enableClear: true,
                                width: 150,
                                options: ['first', 'last', 'min', 'max']
                            })
                        }),
                        wrapperOption({
                            label: 'Baseline',
                            propName: 'SparklineProps.baseline',
                            info: 'Empty for no line.',
                            control: numberInput({bind: 'baseline', width: 70})
                        }),
                        wrapperOption({
                            label: 'Tooltip',
                            propName: 'SparklineProps.tooltip',
                            info: 'A function of the data, returning an element.',
                            control: switchInput({bind: 'tooltip'})
                        }),
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
                                data: raw('data'),
                                ...lineProps,
                                markers: markers?.length ? raw(fmtMarkers(markers)) : undefined,
                                tooltip: tooltip ? raw('trendTip') : undefined,
                                width: stretch ? '100%' : undefined,
                                height: stretch ? 60 : undefined
                            }),
                            item: sparkline({
                                data: model.data,
                                ...lineProps,
                                markers,
                                tooltip: tooltip ? trendTip : undefined,
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
                                        sparkline({data: UP, type}),
                                        div({
                                            style: {marginTop: 8},
                                            item: sparkline({
                                                data: UP,
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
                                labeled('default', sparkline({data: UP})),
                                ...(['primary', 'success', 'warning', 'danger'] as Intent[]).map(
                                    intent =>
                                        labeled(intent, sparkline({data: UP, intent, type: 'area'}))
                                ),
                                labeled('trend up', sparkline({data: UP, colorByTrend: true})),
                                labeled('trend down', sparkline({data: DOWN, colorByTrend: true})),
                                labeled(
                                    'CSS color',
                                    sparkline({
                                        data: UP,
                                        className: 'tb-sparkline-panel__orange'
                                    })
                                )
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Marks',
                        note: 'markers and a baseline, at 160 by 40.',
                        item: div({
                            className: 'tb-sparkline-panel__row',
                            items: [
                                labeled(
                                    "markers: ['last']",
                                    sparkline({data: UP, markers: ['last'], ...MID})
                                ),
                                labeled(
                                    "markers: ['min', 'max']",
                                    sparkline({data: DOWN, markers: ['min', 'max'], ...MID})
                                ),
                                labeled(
                                    'all four, by trend',
                                    sparkline({
                                        data: UP,
                                        markers: ['first', 'last', 'min', 'max'],
                                        colorByTrend: true,
                                        type: 'area',
                                        ...MID
                                    })
                                ),
                                labeled(
                                    'baseline: 105',
                                    sparkline({data: UP, baseline: 105, ...MID})
                                ),
                                labeled(
                                    'baseline off the series',
                                    sparkline({data: UP, baseline: 90, markers: ['last'], ...MID})
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
                                        data: DAILY_PNL,
                                        type: 'bar',
                                        colorNegative: true,
                                        baseline: 0,
                                        ...MID
                                    })
                                ),
                                labeled(
                                    'far from zero',
                                    sparkline({data: UP, type: 'bar', ...MID})
                                ),
                                labeled(
                                    'min: 100',
                                    sparkline({data: UP, type: 'bar', min: 100, ...MID})
                                ),
                                labeled(
                                    'baseline: 108',
                                    sparkline({
                                        data: UP,
                                        type: 'bar',
                                        baseline: 108,
                                        colorNegative: true,
                                        ...MID
                                    })
                                ),
                                labeled(
                                    '60 bars',
                                    sparkline({
                                        data: Array.from({length: 60}, (_, i) =>
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
                                    sparkline({data: UP, colorByTrend: true, markers: ['last']}),
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
                                            data: model.longSeries,
                                            width: '100%',
                                            height: 60,
                                            markers: ['last', 'min', 'max']
                                        })
                                    }),
                                    demoFrame({
                                        label: 'Stretched bars',
                                        info: "width: '100%', height: 60",
                                        item: sparkline({
                                            data: DAILY_PNL,
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
                                    data: ORDERS_BY_DAY,
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
                                    data: DAILY_PNL,
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
                                    data: UP,
                                    colorByTrend: true,
                                    markers: ['last']
                                }),
                                detail: 'vs. last month, 42 locations'
                            }),
                            statCard({
                                title: 'Returns',
                                value: fmtNumber(87412, {precision: 0}),
                                subValue: fmtPercent(-0.093, {precision: 1, withSignGlyph: true}),
                                detail: sparkline({
                                    data: DOWN,
                                    colorByTrend: true,
                                    width: '100%',
                                    markers: ['min', 'max']
                                })
                            })
                        )
                    }),
                    demoSection({
                        title: 'In a Grid Column',
                        note: 'The same 30 closing prices in Hoist and AG Grid sparklines. Hover a cell for a tooltip - one per sparkline in Hoist, one per point in AG Grid. Each row scales to itself.',
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
                                    sparkline({data: [3, 5, null, null, 6, 8, NaN, 7, 9], ...MID})
                                ),
                                labeled(
                                    'gaps, bars',
                                    sparkline({
                                        data: [3, 5, null, null, 6, 8, NaN, 7, 9],
                                        type: 'bar',
                                        ...MID
                                    })
                                ),
                                labeled('one value', sparkline({data: [5], ...MID})),
                                labeled('all the same', sparkline({data: [4, 4, 4, 4], ...MID})),
                                labeled('empty', sparkline({data: [], ...MID})),
                                labeled('null', sparkline({data: null, ...MID}))
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Restyled with CSS Variables',
                        note: 'A thick line, large dots and a strong area fill.',
                        item: demoFrame({
                            className: 'tb-sparkline-panel__restyled',
                            item: sparkline({
                                data: UP,
                                type: 'area',
                                intent: 'primary',
                                markers: ['last', 'min', 'max'],
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

/**
 * Tooltip for a sparkline in the Playground and the grid: the first and last values, the change
 * between them, and the range. Null for a series with no values, so no tooltip shows.
 */
function trendTip(data: number[], title?: string): ReactElement {
    const values = (data ?? []).filter(it => isFinite(it));
    if (!values.length) return null;

    const start = first(values),
        end = last(values),
        change = start ? (end - start) / Math.abs(start) : null;
    return div({
        className: 'tb-sparkline-tip',
        items: [
            title ? div({className: 'tb-sparkline-tip__title', item: title}) : null,
            ...tipRow('First', fmtNumber(start)),
            ...tipRow('Last', fmtNumber(end)),
            ...tipRow(
                'Change',
                change == null
                    ? '-'
                    : fmtPercent(change, {precision: 1, colorSpec: true, withSignGlyph: true})
            ),
            ...tipRow('Range', span(fmtNumber(min(values)), ' to ', fmtNumber(max(values))))
        ]
    });
}

function tipRow(label: string, value: ReactNode) {
    return [
        span({key: label, item: label}),
        span({key: `${label}-value`, className: 'tb-sparkline-tip__value', item: value})
    ];
}

function fmtMarkers(markers: SparklineMarker[]): string {
    return `[${markers.map(it => `'${it}'`).join(', ')}]`;
}

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
                    sparkline({data: values, type: 'area', width: 200, height: 48, ...scale})
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
    @bindableRef accessor markers: SparklineMarker[] = [];
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
                headerName: 'Hoist, 30 days',
                width: 150,
                autosizable: false,
                sortable: false,
                excludeFromExport: true,
                renderer: (values, {record}) =>
                    sparkline({
                        data: values,
                        width: '100%',
                        colorByTrend: true,
                        tooltip: data => trendTip(data, record.data.symbol)
                    })
            },
            {
                ...closingPriceAgSparklineCol,
                headerName: 'AG Grid, 30 days',
                width: 150,
                excludeFromExport: true
            },
            {
                field: 'volumeBars',
                headerName: 'As bars',
                width: 150,
                autosizable: false,
                sortable: false,
                excludeFromExport: true,
                renderer: values =>
                    sparkline({
                        data: values,
                        type: 'bar',
                        width: '100%',
                        min: min(values as number[])
                    })
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
                        data: values,
                        type: 'area',
                        width: '100%',
                        markers: ['last', 'min', 'max']
                    })
            }
        ]
    });

    get data(): number[] {
        return {up: UP, down: DOWN, pnl: DAILY_PNL}[this.series];
    }

    /**
     * Props for the Playground sparkline, less its data, markers, tooltip and size. Options left
     * off resolve to undefined, so the snippet omits them. The snippet reads this same getter, so
     * the code shown cannot drift from the sparkline beside it.
     */
    get lineProps(): PlaygroundLineProps {
        const {type, intent, colorByTrend, colorNegative, baseline} = this;
        return {
            type: type ?? undefined,
            intent: intent ?? undefined,
            colorByTrend: colorByTrend || undefined,
            colorNegative: colorNegative || undefined,
            baseline: baseline ?? undefined
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
                    closingPrices: takeRight(series, 30),
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
    baseline?: number;
}
