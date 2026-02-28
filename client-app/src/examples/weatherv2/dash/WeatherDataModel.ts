import {HoistModel, LoadSpec, XH} from '@xh/hoist/core';
import {action, makeObservable, observable} from '@xh/hoist/mobx';
import {
    WeatherData,
    NormalizedCurrent,
    NormalizedForecastEntry,
    CurrentWeatherResponse,
    ForecastResponse
} from '../Types';

/** Client-side staleness threshold — 5 minutes. */
const STALE_MS = 5 * 60 * 1000;

/**
 * Shared data provider for V2 weather widgets.
 *
 * Maintains a per-city cache of normalized weather data. Widgets call
 * `ensureDataAsync(city)` to trigger a fetch (if not cached or stale),
 * then read the observable cache reactively.
 */
export class WeatherDataModel extends HoistModel {
    /** Observable cache: city → WeatherData. Replace the map reference to trigger reactions. */
    @observable.ref
    private _cache = new Map<string, WeatherData>();

    constructor() {
        super();
        makeObservable(this);
    }

    /** Get cached data for a city (synchronous, may return null if not yet loaded). */
    getData(city: string): WeatherData | null {
        return this._cache.get(city) ?? null;
    }

    /**
     * Ensure data is loaded for a city. Fetches from server if not cached or stale.
     * Returns the cached data (which is also observable via `getData`).
     */
    async ensureDataAsync(city: string, loadSpec?: LoadSpec): Promise<WeatherData> {
        const cached = this._cache.get(city);
        if (cached && !this.isStale(cached)) return cached;

        const [currentRaw, forecastRaw] = await Promise.all([
            XH.fetchJson({url: 'weather/current', params: {city}, loadSpec}),
            XH.fetchJson({url: 'weather/forecast', params: {city}, loadSpec})
        ]);

        if (loadSpec?.isStale) return cached ?? this.emptyData(city);

        const data = this.normalize(city, currentRaw, forecastRaw);
        this.updateCache(city, data);
        return data;
    }

    @action
    private updateCache(city: string, data: WeatherData) {
        const next = new Map(this._cache);
        next.set(city, data);
        this._cache = next;
    }

    private isStale(data: WeatherData): boolean {
        return Date.now() - data.fetchedAt > STALE_MS;
    }

    private normalize(
        city: string,
        current: CurrentWeatherResponse,
        forecast: ForecastResponse
    ): WeatherData {
        const normalizedCurrent: NormalizedCurrent = {
            temp: current.main.temp,
            feelsLike: current.main.feels_like,
            humidity: current.main.humidity,
            pressure: current.main.pressure,
            windSpeed: current.wind.speed,
            windGust: current.wind.gust,
            conditions: current.weather?.[0]?.main ?? 'Unknown',
            description: current.weather?.[0]?.description ?? '',
            iconCode: current.weather?.[0]?.icon ?? '01d'
        };

        const normalizedForecast: NormalizedForecastEntry[] = (forecast.list ?? []).map(item => ({
            dt: item.dt * 1000,
            temp: item.main.temp,
            feelsLike: item.main.feels_like,
            tempMin: item.main.temp_min,
            tempMax: item.main.temp_max,
            humidity: item.main.humidity,
            pressure: item.main.pressure,
            windSpeed: item.wind.speed,
            windGust: item.wind.gust,
            precipProbability: Math.round(item.pop * 100),
            precipVolume: item.rain?.['3h'] ?? 0,
            conditions: item.weather?.[0]?.main ?? 'Unknown',
            description: item.weather?.[0]?.description ?? '',
            iconCode: item.weather?.[0]?.icon ?? '01d'
        }));

        return {
            city,
            current: normalizedCurrent,
            forecast: normalizedForecast,
            fetchedAt: Date.now()
        };
    }

    private emptyData(city: string): WeatherData {
        return {
            city,
            current: {
                temp: 0,
                feelsLike: 0,
                humidity: 0,
                pressure: 0,
                windSpeed: 0,
                conditions: 'Unknown',
                description: '',
                iconCode: '01d'
            },
            forecast: [],
            fetchedAt: 0
        };
    }
}
