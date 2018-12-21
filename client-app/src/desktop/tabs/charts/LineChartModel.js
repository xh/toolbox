import {HoistModel} from '@xh/hoist/core';
import {ChartModel} from '@xh/hoist/desktop/cmp/chart';
import {observable, action} from '@xh/hoist/mobx';
import Highcharts from 'highcharts/highstock';
import moment from 'moment';
import Amazon from '../../../core/data/charts/amazonPricing';
import Facebook from '../../../core/data/charts/facebookPricing';
import Yahoo from '../../../core/data/charts/yahooPricing';

@HoistModel
export class LineChartModel {
    @observable currentCompany = 'Amazon';
    companyMap = {Amazon, Facebook, Yahoo};
    chartModel = new ChartModel({config: this.getChartModelCfg()});

    constructor() {
        this.addAutorun(() => this.loadChart());
    }

    @action
    setCurrentCompany(currentCompany) {
        this.currentCompany = currentCompany;
    }

    loadChart() {
        const company = this.currentCompany,
            data = this.companyMap[company];

        const prices = data.map(it => {
            const date = moment(it.valueDate).valueOf();
            return [date, it.close];
        });

        const series = this.createChartSeries(company, prices);
        this.chartModel.setSeries(series);
    }

    getChartModelCfg() {
        return {
            chart: {
                zoomType: 'x'
            },
            title: {
                text: 'Stock price over time'
            },
            subtitle: {
                text: 'Click and drag in the plot area to zoom in'
            },
            scrollbar: {
                enabled: false
            },
            rangeSelector: {
                enabled: true
            },
            navigator: {
                enabled: true
            },
            xAxis: {
                type: 'datetime'
            },
            yAxis: {
                title: {
                    text: 'USD'
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1
                        },
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {
                        radius: 2
                    },
                    lineWidth: 1,
                    states: {
                        hover: {
                            lineWidth: 1
                        }
                    },
                    threshold: null
                }
            },
            exporting: {
                enabled: true
            }
        };
    }

    createChartSeries(name, data) {
        return [
            {
                name: name,
                type: 'area',
                data: data
            }
        ];
    }
}