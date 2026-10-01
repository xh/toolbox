import {library} from '@fortawesome/fontawesome-svg-core';
import {
    faCloudRain,
    faDropletPercent,
    faCalendarDays,
    faSparkles,
    faTemperatureHalf,
    faWind
} from '@fortawesome/pro-regular-svg-icons';
import {Icon} from '@xh/hoist/icon';

library.add(faCloudRain, faDropletPercent, faCalendarDays, faSparkles, faTemperatureHalf, faWind);

export const temperatureIcon = (opts = {}) => Icon.icon({iconName: 'temperature-half', ...opts});
export const cloudRainIcon = (opts = {}) => Icon.icon({iconName: 'cloud-rain', ...opts});
export const windIcon = (opts = {}) => Icon.icon({iconName: 'wind', ...opts});
export const dropletPercentIcon = (opts = {}) => Icon.icon({iconName: 'droplet-percent', ...opts});
export const calendarDaysIcon = (opts = {}) => Icon.icon({iconName: 'calendar-days', ...opts});
export const sparklesIcon = (opts = {}) => Icon.icon({iconName: 'sparkles', ...opts});
