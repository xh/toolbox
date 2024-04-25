import {HoistModel, managed, XH} from '@xh/hoist/core';
import {ChartModel} from '@xh/hoist/cmp/chart';
import {makeObservable, bindable} from '@xh/hoist/mobx';
import {fmtDate, fmtPrice} from '@xh/hoist/format';

export class ChartPageModel extends HoistModel {
    @bindable currentSymbol: string = '';
    @bindable.ref symbols: string[] = null;

    numCompanies: number = 3;

    @managed
    chartModel: ChartModel = new ChartModel({highchartsConfig: this.getChartModelCfg()});

    constructor() {
        super();
        makeObservable(this);
        this.addReaction({
            track: () => this.currentSymbol,
            run: () => this.loadAsync()
        });
    }

    override async doLoadAsync(loadSpec) {
        if (!this.symbols) {
            let symbols = await XH.portfolioService.getSymbolsAsync({loadSpec});
            symbols = symbols.slice(0, this.numCompanies);
            this.symbols = symbols;
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

        const groupPixelWidth = 5;
        Object.assign(series, {
            dataGrouping: {
                enabled: !!groupPixelWidth,
                groupPixelWidth: groupPixelWidth
            }
        });

        this.chartModel.setSeries(series);
    }

    getChartModelCfg() {
        return {
            chart: {
                type: 'ohlc',
                zoomType: 'x'
            },
            rangeSelector: {enabled: true, selected: 5},
            navigator: {enabled: true},
            title: {text: null},
            legend: {enabled: false},
            scrollbar: {enabled: false},
            xAxis: {
                labels: {
                    formatter: function () {
                        return fmtDate(this.value, {asHtml: true});
                    }
                }
            },
            yAxis: {
                title: {text: null},
                opposite: true,
                endOnTick: true,
                showLastLabel: true
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
