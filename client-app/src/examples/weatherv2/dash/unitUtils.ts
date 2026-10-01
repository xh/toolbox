/**
 * Unit conversion utilities. Server returns imperial (°F, mph).
 * Display widgets convert to metric when their `units` input is 'metric'.
 */

/** Convert Fahrenheit to Celsius. */
export function toMetricTemp(f: number): number {
    return Math.round(((f - 32) * 5) / 9);
}

/** Convert mph to m/s. */
export function toMetricWind(mph: number): number {
    return Math.round(mph * 0.44704 * 10) / 10;
}

/** Format temperature with unit suffix. */
export function fmtTemp(f: number, units: string = 'imperial'): string {
    return units === 'metric' ? `${toMetricTemp(f)}°C` : `${Math.round(f)}°F`;
}

/** Format wind speed with unit suffix. */
export function fmtWind(mph: number, units: string = 'imperial'): string {
    return units === 'metric' ? `${toMetricWind(mph)} m/s` : `${Math.round(mph)} mph`;
}

/** Get temperature unit label. */
export function tempUnit(units: string = 'imperial'): string {
    return units === 'metric' ? '°C' : '°F';
}

/** Get wind unit label. */
export function windUnit(units: string = 'imperial'): string {
    return units === 'metric' ? 'm/s' : 'mph';
}

/** Convert temperature value for charting (no rounding). */
export function convertTemp(f: number, units: string = 'imperial'): number {
    return units === 'metric' ? ((f - 32) * 5) / 9 : f;
}

/** Convert wind value for charting (no rounding). */
export function convertWind(mph: number, units: string = 'imperial'): number {
    return units === 'metric' ? mph * 0.44704 : mph;
}
