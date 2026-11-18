import {
    faCloudRain,
    faDropletPercent,
    faTemperatureHalf,
    faWind
} from '@fortawesome/pro-regular-svg-icons';
import {Icon} from '@xh/hoist/icon';

export const [temperatureIcon, cloudRainIcon, windIcon, dropletPercentIcon] = Icon.registerAll([
    {name: 'temperature', defs: faTemperatureHalf, keywords: ['weather']},
    {name: 'cloudRain', defs: faCloudRain, keywords: ['weather']},
    {name: 'wind', defs: faWind, keywords: ['weather']},
    {name: 'dropletPercent', defs: faDropletPercent, keywords: ['weather', 'humidity']}
]);
