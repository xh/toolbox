import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {img} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, LoadSpec, managed} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {computed, makeObservable} from '@xh/hoist/mobx';
import {groupBy} from 'lodash';
import {WeatherWidgetModel} from '../dash/WeatherWidgetModel';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {fmtTemp, fmtWind} from '../dash/unitUtils';
import {WidgetMeta} from '../dash/types';
import {WeatherData} from '../Types';
import {AppModel} from '../AppModel';

//--------------------------------------------------
// Model
//--------------------------------------------------
export class SummaryGridModel extends WeatherWidgetModel {
    static override meta: WidgetMeta = {
        id: 'summaryGrid',
        title: '5-Day Summary',
        description:
            'Tabular daily overview — one row per day with high/low, conditions, humidity, wind.',
        category: 'display',
        inputs: [
            {
                name: 'city',
                type: 'string',
                required: true,
                default: 'New York',
                description: 'City to summarize.'
            },
            {
                name: 'units',
                type: 'string',
                required: false,
                default: 'imperial',
                description: 'Unit system.'
            }
        ],
        outputs: [],
        config: {
            visibleColumns: {
                type: 'string[]',
                description: 'Columns to display.',
                default: ['date', 'icon', 'conditions', 'high', 'low', 'humidity', 'wind']
            }
        },
        defaultSize: {w: 6, h: 5},
        minSize: {w: 4, h: 3}
    };

    @managed gridModel: GridModel;

    constructor() {
        super();
        makeObservable(this);
    }

    @computed get city(): string {
        return this.resolveInput('city') ?? 'New York';
    }

    @computed get units(): string {
        return this.resolveInput('units') ?? 'imperial';
    }

    override onLinked() {
        super.onLinked();
        this.gridModel = this.createGridModel();

        this.addReaction({
            track: () => this.city,
            run: () => this.loadAsync(),
            fireImmediately: true
        });

        this.addReaction({
            track: () => [this.weatherData, this.units],
            run: () => this.updateGrid(),
            fireImmediately: true
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {city} = this;
        if (!city) return;
        try {
            await AppModel.instance.weatherV2DashModel.weatherDataModel.ensureDataAsync(
                city,
                loadSpec
            );
        } catch (e) {
            // Handled by WeatherDataModel
        }
    }

    @computed get weatherData(): WeatherData | null {
        return AppModel.instance.weatherV2DashModel.weatherDataModel.getData(this.city);
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
                    exportValue: (_v, {record}) => record.data.conditions
                },
                {field: 'conditions', headerName: 'Conditions', flex: 1},
                {field: 'high', headerName: 'High', width: 70, align: 'right'},
                {field: 'low', headerName: 'Low', width: 70, align: 'right'},
                {
                    field: 'humidity',
                    headerName: 'Humidity',
                    width: 80,
                    align: 'right',
                    renderer: v => `${v}%`
                },
                {field: 'wind', headerName: 'Wind', width: 80, align: 'right'}
            ]
        });
    }

    /** Build grid rows with pre-formatted values so cell data changes when units change. */
    private updateGrid() {
        const data = this.weatherData;
        if (!data?.forecast?.length) {
            this.gridModel.clear();
            return;
        }

        const {units} = this;

        const byDay = groupBy(data.forecast, entry => {
            const d = new Date(entry.dt);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        });

        const rows = Object.entries(byDay).map(([_key, dayItems], idx) => {
            const highs = dayItems.map(it => it.tempMax),
                lows = dayItems.map(it => it.tempMin),
                humidities = dayItems.map(it => it.humidity),
                winds = dayItems.map(it => it.windSpeed),
                midItem = dayItems[Math.floor(dayItems.length / 2)];

            return {
                id: idx,
                date: dayItems[0].dt,
                icon: midItem.iconCode,
                conditions: midItem.conditions,
                high: fmtTemp(Math.max(...highs), units),
                low: fmtTemp(Math.min(...lows), units),
                humidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
                wind: fmtWind(winds.reduce((a, b) => a + b, 0) / winds.length, units)
            };
        });

        this.gridModel.loadData(rows);
    }
}

widgetRegistry.register(SummaryGridModel.meta);

//--------------------------------------------------
// Component
//--------------------------------------------------
export const summaryGridWidget = hoistCmp.factory({
    displayName: 'SummaryGridWidget',
    model: creates(SummaryGridModel),

    render() {
        return panel({item: grid()});
    }
});
