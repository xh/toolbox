import {HoistModel, LoadSupport, XH} from '@xh/hoist/core';
import {ChartModel} from '@xh/hoist/cmp/chart';
import {bindable} from '@xh/hoist/mobx';
import {fmtDate} from '@xh/hoist/format';

@HoistModel
@LoadSupport
export class OHLCChartModel {
    @bindable currentSymbol = '';
    @bindable.ref symbols = null;
    numCompanies = 3;
    chartModel = new ChartModel({highchartsConfig: this.getChartModelCfg()});

    @bindable aspectRatio = null;
    
    constructor() {
        this.addReaction({
            track: () => this.currentSymbol,
            run: () => this.loadAsync()
        });
    }
    
    async doLoadAsync(loadSpec) {
        if (!this.symbols) {
            let symbols = await XH.portfolioService.getSymbolsAsync();
            symbols = symbols.slice(0, this.numCompanies);
            this.setSymbols(symbols);
        }
        if (!this.currentSymbol) {
            this.setCurrentSymbol(this.symbols[0]);
        }
        let series = await XH.portfolioService.getOHLCChartSeriesAsync(this.currentSymbol);

        const groupPixelWidth = 5;
        Object.assign(series, {
            dataGrouping: {
                enabled: !!groupPixelWidth,
                groupPixelWidth: groupPixelWidth
            }
        });

        this.chartModel.setSeries([series]);
    }

    getChartModelCfg() {
        return {
            chart: {
                type: 'ohlc',
                spacingLeft: 3,
                spacingBottom: 5,
                zoomType: 'x',
                resetZoomButton: {
                    theme: {
                        display: 'none'
                    }
                }
            },
            legend: {
                enabled: false
            },
            title: {
                text: null
            },
            scrollbar: {
                enabled: false
            },
            xAxis: {
                labels: {
                    formatter: function() {
                        return fmtDate(this.value);
                    }
                }
            },
            yAxis: {
                title: {text: null},
                opposite: false,
                endOnTick: true,
                showLastLabel: true,
                tickPixelInterval: 40,
                maxPadding: 0,
                labels: {
                    y: 3,
                    x: -8
                }
            },
            tooltip: {
                split: false,
                crosshairs: false,
                followPointer: true,
                formatter: function() {
                    const p = this.point;
                    return `
                        ${fmtDate(this.x)}<br>
                        <b>${p.series.name}</b><br>
                        Open: ${p.open}<br>
                        High: ${p.high}<br>
                        Low: ${p.low}<br>
                        Close: ${p.close}<br>
                    `;
                }
            }
        };
    }
}