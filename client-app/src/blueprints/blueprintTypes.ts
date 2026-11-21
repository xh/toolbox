import type {BlueprintRegistry} from '@xh/hoist-chat-kit/blueprint';
import {createPortfolioRegistry, createWeatherRegistry} from './toolboxRegistry';

/**
 * A kind of blueprint, with its own library and what its blueprints are built from: the datasets
 * of the server's Data Catalog they read, and the registry they render with.
 */
export interface BlueprintTypeSpec {
    /** Stored with each blueprint, and names its repository's storage. */
    name: string;
    label: string;
    datasets: string[];
    createRegistry: () => BlueprintRegistry;
}

export const PORTFOLIO_TYPE: BlueprintTypeSpec = {
    name: 'toolbox.portfolio',
    label: 'Portfolio',
    datasets: ['positions', 'fundSummary', 'orders', 'prices', 'hypotheticalPortfolio'],
    createRegistry: createPortfolioRegistry
};

export const WEATHER_TYPE: BlueprintTypeSpec = {
    name: 'toolbox.weather',
    label: 'Weather',
    datasets: ['weather', 'currentWeather'],
    createRegistry: createWeatherRegistry
};

export const BLUEPRINT_TYPES = [PORTFOLIO_TYPE, WEATHER_TYPE];
