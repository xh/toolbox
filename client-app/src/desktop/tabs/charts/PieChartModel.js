import {ChartModel} from '@xh/hoist/cmp/chart';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import Highcharts from 'highcharts/highstock';
import {sortBy} from 'lodash';

export class PieChartModel extends HoistModel {

    @managed
    groupingChooserModel = new GroupingChooserModel({
        dimensions: ['region', 'sector', {name: 'symbol', isLeafDimension: true}],
        initialValue: ['sector', 'symbol'],
        initialFavorites: [
            ['sector', 'symbol'],
            ['region', 'sector', 'symbol'],
            ['region', 'symbol'],
            ['sector'],
            ['symbol']
        ],
        persistWith: {
            localStorageKey: 'gridPieDims',
            persistFavorites: true
        }
    });

    get firstDim() {
        return this.groupingChooserModel.value[0];
    }

    @managed
    chartModel = new ChartModel({highchartsConfig: this.getChartModelCfg()});

    constructor() {
        super();
        this.addReaction({
            track: () => this.groupingChooserModel.value,
            run: () => this.loadAsync()
        });
    }

    async doLoadAsync(loadSpec) {
        const {firstDim} = this;
        const data = await XH.portfolioService.getPositionsAsync([firstDim]),
            series = this.getSeries(data),
            colors = this.getPieColors(data.length);

        this.chartModel.setSeries(series);
        this.chartModel.updateHighchartsConfig({
            title: {text: 'Profit by ' + firstDim},
            plotOptions: {
                pie: {
                    colors
                }
            }
        });
    }

    getSeries(rawData) {
        const sortedData = sortBy(rawData, ['pnl']).reverse(),
            {firstDim} = this;
        console.log(rawData);
        return [{
            name: firstDim,
            colorByPoint: true,
            data: sortedData.map(it => ({
                name: it.name,
                y: it.pnl
            }))
        }];
    }

    getPieColors(points) {
        const colors = [],
            greenBase = Highcharts.getOptions().colors[2];

        for (let i = 0; i < points; i++) {
            
            // Start out with a darkened base color (negative brighten), and end
            // up with a much brighter color
            colors.push(Highcharts.color(greenBase).brighten((i - 3) / 7).get());
        }

        return colors.map(this.applyGradient);
    }

    getChartModelCfg() {
        return {
            chart: {
                type: 'pie'
            },
            exporting: {enabled: true},
            title: {text: null},
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                    }
                }
            }
        };
    }

    applyGradient(color) {
        return {
            radialGradient: {
                cx: 0.5,
                cy: 0.3,
                r: 0.7
            },
            stops: [
                [0, color],
                [1, Highcharts.color(color).brighten(-0.3).get('rgb')] // darken
            ]
        };
    }
}
