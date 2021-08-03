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
            series = this.setSeries(data),
            colors = this.setPieColors(data.length);

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

    setSeries(rawData) {
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

    setPieColors(points) {
        console.log(Highcharts.getOptions().colors);
        const colors = [],
            base = Highcharts.getOptions().colors[2];

        for (let i = 0; i < points; i++) {
        // Start out with a darkened base color (negative brighten), and end
        // up with a much brighter color
            colors.push(Highcharts.color(base).brighten((i - 3) / 7).get());
        }
        return colors;
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
}
