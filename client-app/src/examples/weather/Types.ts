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
