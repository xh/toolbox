import type {RendererSpec} from '@xh/hoist-chat-kit/blueprint';
import {
    faCloud,
    faCloudBolt,
    faCloudDrizzle,
    faCloudFog,
    faCloudSun,
    faSnowflake
} from '@fortawesome/pro-regular-svg-icons';
import {hbox, span} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import type {ReactNode} from 'react';
import {cloudRainIcon} from '../examples/weather/Icons';

const [cloudIcon, cloudBoltIcon, cloudDrizzleIcon, cloudFogIcon, cloudSunIcon, snowflakeIcon] =
    Icon.registerAll([
        {name: 'cloud', defs: faCloud, keywords: ['weather']},
        {name: 'cloudBolt', defs: faCloudBolt, keywords: ['weather', 'thunderstorm']},
        {name: 'cloudDrizzle', defs: faCloudDrizzle, keywords: ['weather']},
        {name: 'cloudFog', defs: faCloudFog, keywords: ['weather', 'mist']},
        {name: 'cloudSun', defs: faCloudSun, keywords: ['weather']},
        {name: 'snowflake', defs: faSnowflake, keywords: ['weather']}
    ]);

const ICONS: Record<string, () => ReactNode> = {
    Clear: () => Icon.sun(),
    Clouds: () => cloudIcon(),
    Rain: () => cloudRainIcon(),
    Drizzle: () => cloudDrizzleIcon(),
    Thunderstorm: () => cloudBoltIcon(),
    Snow: () => snowflakeIcon(),
    Mist: () => cloudFogIcon()
};

/** A weather condition as its icon and name. A condition without its own icon gets a general one. */
export const weatherIconRenderer: RendererSpec = {
    name: 'toolbox.weatherIcon',
    app: true,
    appliesTo: {kinds: ['condition']},
    config: {},
    guidance:
        'Draws a weather condition as an icon and its name. The default for the condition kind.',
    render: (value, {formatValue}) => {
        if (value == null) return null;
        const icon = ICONS[String(value)] ?? (() => cloudSunIcon());
        return hbox({
            className: 'tb-weather-icon',
            alignItems: 'center',
            children: [icon(), span(formatValue(value))]
        });
    }
};
