import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {img} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {makeObservable} from '@xh/hoist/mobx';
import {groupBy} from 'lodash';
import {ForecastResponse} from '../Types';
import {AppModel} from '../AppModel';

export const conditionsSummaryWidget = hoistCmp.factory({
    model: creates(() => ConditionsSummaryModel),

    render() {
        return panel({
            item: grid()
        });
    }
});

class ConditionsSummaryModel extends HoistModel {
    @managed gridModel: GridModel;

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        this.gridModel = this.createGridModel();

        this.addReaction({
            track: () => AppModel.instance.weatherDashModel.forecast,
            run: data => this.updateGrid(data),
            fireImmediately: true
        });
    }

    private createGridModel(): GridModel {
        return new GridModel({
            sortBy: 'date',
            emptyText: 'No forecast data available.',
            columns: [
                {
                    field: 'date',
                    headerName: 'Day',
                    width: 120,
                    renderer: v => {
                        const d = new Date(v);
                        return d.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                        });
                    }
                },
                {
                    field: 'icon',
                    headerName: '',
                    width: 50,
                    rendererIsComplex: true,
                    renderer: (v, {record}) => {
                        return img({
                            src: `https://openweathermap.org/img/wn/${v}.png`,
                            alt: record.data.conditions,
                            width: 32,
                            height: 32
                        });
                    },
                    exportValue: (v, {record}) => record.data.conditions
                },
                {
                    field: 'conditions',
                    headerName: 'Conditions',
                    flex: 1
                },
                {
                    field: 'high',
                    headerName: 'High',
                    width: 70,
                    align: 'right',
                    renderer: v => `${v}°F`
                },
                {
                    field: 'low',
                    headerName: 'Low',
                    width: 70,
                    align: 'right',
                    renderer: v => `${v}°F`
                },
                {
                    field: 'humidity',
                    headerName: 'Humidity',
                    width: 80,
                    align: 'right',
                    renderer: v => `${v}%`
                },
                {
                    field: 'wind',
                    headerName: 'Wind',
                    width: 80,
                    align: 'right',
                    renderer: v => `${v} mph`
                }
            ]
        });
    }

    private updateGrid(data: ForecastResponse) {
        if (!data?.list) {
            this.gridModel.clear();
            return;
        }

        const items = data.list,
            byDay = groupBy(items, item => {
                const d = new Date(item.dt * 1000);
                return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            });

        const rows = Object.entries(byDay).map(([_key, dayItems], idx) => {
            const highs = dayItems.map(it => it.main.temp_max),
                lows = dayItems.map(it => it.main.temp_min),
                humidities = dayItems.map(it => it.main.humidity),
                winds = dayItems.map(it => it.wind?.speed ?? 0),
                midItem = dayItems[Math.floor(dayItems.length / 2)],
                conditions = midItem.weather?.[0]?.main ?? '',
                icon = midItem.weather?.[0]?.icon ?? '01d';

            return {
                id: idx,
                date: dayItems[0].dt * 1000,
                icon,
                conditions,
                high: Math.round(Math.max(...highs)),
                low: Math.round(Math.min(...lows)),
                humidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
                wind: Math.round(winds.reduce((a, b) => a + b, 0) / winds.length)
            };
        });

        this.gridModel.loadData(rows);
    }
}
