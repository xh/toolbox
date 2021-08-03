import {ChartModel} from '@xh/hoist/cmp/chart';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import Highcharts from 'highcharts/highstock';
import {capitalize, isEmpty, sortBy} from 'lodash';

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

    get chartTitle() {
        return 'Profit by ' + this.groupingChooserModel.value.map(capitalize).join(' > ');
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
        const data = await XH.portfolioService.getPositionsAsync(this.groupingChooserModel.value),
            sortedData = this.sort(data),    
            series = this.getSeries(sortedData),
            colors = this.getPieColors(sortedData.length);

        this.chartModel.setSeries(series);
        this.chartModel.updateHighchartsConfig({
            title: {text: this.chartTitle},
            plotOptions: {
                pie: {
                    colors
                }
            },
            drilldown: this.getDrilldown(sortedData)
        });
    }

    getSeries(data) {
        const dims = this.groupingChooserModel.value,
            hasDrilldown = dims.length > 1,
            {firstDim} = this;
        console.log(data);

        return [{
            name: firstDim,
            colorByPoint: true,
            data: data.map(it => ({
                name: it.name,
                y: it.pnl,
                drilldown: hasDrilldown ? it.name : undefined
            }))
        }];
    }

    getDrilldown(data) {
        const dims = this.groupingChooserModel.value;
        if (dims.length === 1) return;

        const ret = {series: []};

        data.forEach(prt => {
            if (isEmpty(prt.children)) return;
            
            ret.series.push({
                name: prt.name,
                id: prt.name,
                data: prt.children.map(it => ({
                    name: it.name,
                    y: it.pnl
                }))
            });
        });

        console.log(ret);
        return ret;
    }

    sort(data) {
        return sortBy(data, ['pnl']).reverse();
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
