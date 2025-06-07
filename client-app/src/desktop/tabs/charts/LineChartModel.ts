import {ChartModel} from '@xh/hoist/cmp/chart';
import {ChartMenuContext, ChartMenuToken} from '@xh/hoist/cmp/chart/Types';
import {div, hr} from '@xh/hoist/cmp/layout';
import {type ContextMenuSpec, HoistModel, managed, XH} from '@xh/hoist/core';
import {fmtDate} from '@xh/hoist/format';
import {observable, makeObservable, runInAction, bindable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {pluralize} from '@xh/hoist/utils/js';
import Highcharts from 'highcharts/highstock';
import {isEmpty} from 'lodash';

export class LineChartModel extends HoistModel {
    @bindable currentSymbols: string[] = [];
    @observable.ref symbols: string[] = [];

    @bindable currentContextMenu = null;
    contextMenuOptions = [
        {
            label: 'Default',
            value: null
        },
        {
            label: 'None',
            value: false
        },
        {
            label: 'Custom',
            value: 'custom'
        }
    ];

    @managed
    @observable.ref
    chartModel: ChartModel;

    constructor() {
        super();
        makeObservable(this);

        this.addReaction({
            track: () => this.currentSymbols,
            run: () => this.loadAsync()
        });

        this.addReaction({
            track: () => this.currentContextMenu,
            run: () => {
                this.chartModel = this.getChartModel();
                this.loadAsync();
            }
        });

        this.chartModel = this.getChartModel();
    }

    override async doLoadAsync(loadSpec) {
        if (isEmpty(this.symbols)) {
            let symbols = await XH.portfolioService.getSymbolsAsync({loadSpec});
            runInAction(() => (this.symbols = symbols.slice(0, 5)));
        }

        if (isEmpty(this.currentSymbols)) {
            runInAction(() => (this.currentSymbols = [this.symbols[0]]));
            return; // Reaction to `currentSymbol` value change will trigger final run.
        }

        let series = await Promise.all(
            this.currentSymbols.map(
                it =>
                    XH.portfolioService
                        .getLineChartSeriesAsync({
                            symbol: it,
                            dimension: 'close',
                            loadSpec
                        })
                        .catchDefault() ?? {}
            )
        );

        Object.assign(series[0], {
            type: 'area',
            animation: true
        });

        this.chartModel.setSeries(series);
    }

    private getChartModel() {
        return new ChartModel({
            highchartsConfig: this.getChartModelCfg(),
            contextMenu:
                this.currentContextMenu === 'custom'
                    ? this.customContextMenu
                    : this.currentContextMenu
        });
    }

    private getChartModelCfg() {
        const fillColor = Highcharts.getOptions().colors[0];
        return {
            chart: {zoomType: 'x'},
            navigator: {enabled: true},
            rangeSelector: {enabled: true},
            exporting: {enabled: false},
            legend: {enabled: false},
            tooltip: {shared: true},
            scrollbar: {enabled: false},
            xAxis: {type: 'datetime'},
            yAxis: {title: {text: 'USD'}},
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
                        stops: [
                            [0, fillColor],
                            [1, 'rgba(255,255,255,0)']
                        ]
                    },
                    lineWidth: 1,
                    states: {
                        hover: {lineWidth: 1}
                    },
                    threshold: null
                }
            }
        };
    }

    private customContextMenu: ContextMenuSpec<ChartMenuToken, ChartMenuContext> = [
        'viewFullscreen',
        'copyToClipboard',
        'printChart',
        '-',
        {
            text: 'Images',
            items: ['downloadJPEG', 'downloadPNG', 'downloadSVG', 'downloadPDF']
        },
        '-',
        {
            text: 'Data',
            items: ['downloadCSV', 'downloadXLS']
        },
        '-',
        {
            text: 'Sample Custom Function',
            icon: Icon.json(),
            actionFn: (menuItemEvent, {point, points}) => {
                const otherPtsCount = points.length - 1,
                    message = div({
                        items: point
                            ? [
                                  'Custom chart menu items have access to the clicked point(s) in the series.',
                                  div(`${point.series.name}: (${fmtDate(point.x)}, ${point.y})`),
                                  ...(!otherPtsCount
                                      ? []
                                      : [
                                            hr(),
                                            `${otherPtsCount} other ${pluralize('point', otherPtsCount)} available.`
                                        ])
                              ]
                            : [
                                  'Custom chart menu items have access to the clicked point in the series, when a point is active when opening the context menu.'
                              ]
                    });
                XH.successToast({message});
            }
        }
    ];
}
