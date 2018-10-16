/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {HoistModel} from '@xh/hoist/core';
import {ChartModel} from '@xh/hoist/desktop/cmp/chart';
import {observable, action} from '@xh/hoist/mobx';
import {fmtDate} from '@xh/hoist/format';
import moment from 'moment';
import Amazon from '../../../core/data/rest/charts/amazonPricing';
import Facebook from '../../../core/data/rest/charts/facebookPricing';
import Yahoo from '../../../core/data/rest/charts/yahooPricing';

@HoistModel
export class PortfolioOLHCChartModel {
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
            return [date, it.open, it.high, it.low, it.close];
        });

        const series = this.createChartSeries(company, prices, 5);
        this.chartModel.setSeries(series);
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

    createChartSeries(name, data, groupPixelWidth) {
        return [
            {
                name: name,
                type: 'ohlc',
                color: 'rgba(219, 0, 1, 0.55)',
                upColor: 'rgba(23, 183, 0, 0.85)',
                dataGrouping: {
                    enabled: !!groupPixelWidth,
                    groupPixelWidth: groupPixelWidth
                },
                data: data
            }
        ];
    }
}