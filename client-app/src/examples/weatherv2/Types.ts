/**
 * Normalized weather data types for V2.
 * Widgets consume these types — not raw API responses.
 */

/** Cached weather data for a single city. */
export interface WeatherData {
    city: string;
    current: NormalizedCurrent;
    forecast: NormalizedForecastEntry[];
    fetchedAt: number;
}

/** Normalized current conditions. */
export interface NormalizedCurrent {
    temp: number;
    feelsLike: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windGust?: number;
    conditions: string;
    description: string;
    iconCode: string;
}

/** Normalized forecast entry (3-hour interval). */
export interface NormalizedForecastEntry {
    dt: number;
    temp: number;
    feelsLike: number;
    tempMin: number;
    tempMax: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windGust?: number;
    precipProbability: number;
    precipVolume: number;
    conditions: string;
    description: string;
    iconCode: string;
}

/** Raw API response types — used only for parsing server responses. */
export interface CurrentWeatherResponse {
    weather: WeatherCondition[];
    main: {temp: number; feels_like: number; humidity: number; pressure: number};
    wind: {speed: number; gust?: number};
}

export interface ForecastResponse {
    list: ForecastItem[];
}

export interface ForecastItem {
    dt: number;
    main: {
        temp: number;
        feels_like: number;
        humidity: number;
        pressure: number;
        temp_max: number;
        temp_min: number;
    };
    weather: WeatherCondition[];
    wind: {speed: number; gust?: number};
    rain?: {'3h': number};
    pop: number;
}

export interface WeatherCondition {
    main: string;
    description: string;
    icon: string;
}
