import {div} from '@xh/hoist/cmp/layout';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {ChartModel} from '@xh/hoist/cmp/chart';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {fmtDate, fmtPrice} from '@xh/hoist/format';
import {isEmpty} from 'lodash';

export class OHLCChartModel extends HoistModel {
    @bindable currentSymbol: string = '';
    @bindable.ref symbols: string[] = [];
    @bindable aspectRatio: number = null;

    @managed
    chartModel = new ChartModel({
        highchartsConfig: this.getChartModelCfg(),
        contextMenu: [
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
                actionFn: (menuItemEvent, {point}) => {
                    const message = div({
                        items: point
                            ? [
                                  'Custom chart menu items have access to the clicked point in the series.',
                                  div(`X: ${fmtDate(point.x)}`),
                                  div(`Y: ${point.y}`)
                              ]
                            : [
                                  'Custom chart menu items have access to the clicked point in the series, when a point is active when opening the context menu.'
                              ]
                    });
                    XH.successToast({message});
                }
            }
        ]
    });

    constructor() {
        super();
        makeObservable(this);

        this.addReaction({
            track: () => this.currentSymbol,
            run: () => this.loadAsync()
        });
    }

    override async doLoadAsync(loadSpec) {
        if (isEmpty(this.symbols)) {
            let symbols = await XH.portfolioService.getSymbolsAsync({loadSpec});
            this.symbols = symbols.slice(0, 5);
        }

        if (!this.currentSymbol) {
            this.currentSymbol = this.symbols[0];
        }

        let series =
            (await XH.portfolioService
                .getOHLCChartSeriesAsync({
                    symbol: this.currentSymbol,
                    loadSpec
                })
                .catchDefault()) ?? {};

        Object.assign(series, {
            dataGrouping: {
                enabled: true,
                groupPixelWidth: 5
            }
        });

        this.chartModel.setSeries(series);
    }

    private getChartModelCfg() {
        return {
            chart: {
                type: 'ohlc',
                zoomType: 'x',
                animation: false
            },
            exporting: {enabled: true},
            rangeSelector: {enabled: true, selected: 4},
            legend: {enabled: false},
            scrollbar: {enabled: false},
            xAxis: {
                type: 'datetime',
                labels: {
                    formatter: function () {
                        return fmtDate(this.value, {asHtml: true});
                    }
                }
            },
            yAxis: {
                opposite: true,
                title: {text: null}
            },
            tooltip: {
                useHTML: true,
                formatter: function () {
                    const p = this.point,
                        opts = {asHtml: true};

                    return `
                        <div class="xh-chart-tooltip">
                        <div class="xh-chart-tooltip__title"><b>${p.series.name}</b> ${fmtDate(
                            this.x,
                            opts
                        )}</div>
                        <table>
                            <tr><th>Open:</th><td>${fmtPrice(p.open, opts)}</td></tr>
                            <tr><th>High:</th><td>${fmtPrice(p.high, opts)}</td></tr>
                            <tr><th>Low:</th><td>${fmtPrice(p.low, opts)}</td></tr>
                            <tr><th>Close:</th><td>${fmtPrice(p.close, opts)}</td></tr>
                        </table>
                        </div>
                    `;
                }
            }
        };
    }
}
