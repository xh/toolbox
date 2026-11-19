import {BlueprintRegistry} from '@xh/hoist-chat-kit/blueprint';
import type {
    ActionSpec,
    RendererSpec,
    ResolverSpec,
    VariableTypeSpec
} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import {fundInput} from './FundInput';
import {portfolioBuilderSpec} from './PortfolioBuilder';
import {renderTicker} from './Ticker';
import {weatherIconRenderer} from './WeatherIcon';

export const fundType: VariableTypeSpec = {
    name: 'fund',
    app: true,
    matches: 'string',
    guidance:
        "A fund's identifier, which in Toolbox is its name, such as 'Oak Mount'. Its prompt " +
        "input shows each fund's name and AUM, and supplies its own choices.",
    input: props => fundInput(props)
};

export const portfolioType: VariableTypeSpec = {
    name: 'portfolio',
    app: true,
    matches: 'portfolio',
    guidance:
        'A hypothetical portfolio: {"holdings": [{"symbol": "AAPL", "weight": 0.5}]}, with ' +
        'weights as fractions. A portfolio builder sets it, and sets it to null when empty.'
};

export const userFundResolver: ResolverSpec = {
    name: 'userFund',
    app: true,
    returns: 'fund',
    args: {},
    guidance: "The current user's own fund.",
    resolve: () => XH.getPref('blueprintsFund')
};

export const tickerRenderer: RendererSpec = {
    name: 'ticker',
    app: true,
    appliesTo: {kinds: ['ticker']},
    config: {},
    guidance: 'Draws a symbol with its root ticker emphasized. The default for the ticker kind.',
    render: value => renderTicker(value)
};

/**
 * Publish a report to the PM pack. Toolbox has no PM pack, so publishing records the request in
 * activity tracking and confirms it with a toast.
 */
export const publishToPmPackAction: ActionSpec = {
    name: 'publishToPmPack',
    app: true,
    sideEffects: true,
    params: {fund: 'fund', asOf: 'localDate'},
    guidance: 'Publishes a report to the PM pack. Always asks the user to confirm.',
    describe: ({fund, asOf}) => `Publish the report for ${fund ?? 'all funds'}, ${asOf}`,
    run: ({fund, asOf}) => {
        XH.track({category: 'Blueprints', message: 'Published to PM pack', data: {fund, asOf}});
        XH.successToast(
            `Published the report for ${fund ?? 'all funds'}, ${asOf}, to the PM pack.`
        );
    }
};

/** The built-in registry, plus Toolbox's own variable types, resolvers and renderers. */
export function createToolboxRegistry(): BlueprintRegistry {
    return new BlueprintRegistry({
        widgets: [portfolioBuilderSpec],
        variableTypes: [fundType, portfolioType],
        resolvers: [userFundResolver],
        actions: [publishToPmPackAction],
        renderers: [tickerRenderer, weatherIconRenderer]
    });
}
