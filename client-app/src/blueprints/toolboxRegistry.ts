import {BlueprintRegistry} from '@xh/hoist-chat-kit/blueprint';
import type {
    ActionSpec,
    RendererSpec,
    ResolverSpec,
    ToolSpec,
    VariableTypeSpec
} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import {fundInput} from './FundInput';
import type {Portfolio} from './PortfolioBuilder';
import {fetchInstrumentsAsync, portfolioBuilderSpec} from './PortfolioBuilder';
import {renderTicker} from './Ticker';
import {weatherIconRenderer} from './WeatherIcon';

export const fundType: VariableTypeSpec = {
    name: 'toolbox.fund',
    app: true,
    matches: 'string',
    guidance:
        "A fund's identifier, which in Toolbox is its name, such as 'Oak Mount'. Its prompt " +
        "input shows each fund's name and AUM, and supplies its own choices.",
    input: props => fundInput(props)
};

export const portfolioType: VariableTypeSpec = {
    name: 'toolbox.portfolio',
    app: true,
    matches: 'toolbox.portfolio',
    guidance:
        'A hypothetical portfolio: {"holdings": [{"symbol": "AAPL", "weight": 0.5}]}, with ' +
        'weights as fractions. A portfolio builder sets it, and sets it to null when empty.',
    schema: {
        type: 'object',
        required: ['holdings'],
        properties: {
            holdings: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['symbol', 'weight'],
                    properties: {symbol: {type: 'string'}, weight: {type: 'number'}}
                }
            }
        }
    },
    checkAsync: async value => {
        // A blank symbol is the schema's to flag, as a new holding starts blank.
        const symbols =
            (value as Portfolio)?.holdings?.map(it => it.symbol?.trim()).filter(Boolean) ?? [];
        if (!symbols.length) return null;
        const known = new Set((await fetchInstrumentsAsync()).map(it => it.symbol)),
            unknown = symbols.filter(it => !known.has(it));
        return unknown.length
            ? `Unknown symbol(s): ${unknown.join(', ')}. Use symbols the portfolio data holds.`
            : null;
    }
};

export const userFundResolver: ResolverSpec = {
    name: 'toolbox.userFund',
    app: true,
    returns: 'toolbox.fund',
    args: {},
    guidance: "The current user's own fund.",
    resolve: () => XH.getPref('blueprintsFund')
};

export const tickerRenderer: RendererSpec = {
    name: 'toolbox.ticker',
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
    name: 'toolbox.publishToPmPack',
    app: true,
    sideEffects: true,
    params: {
        type: 'object',
        required: ['fund', 'asOf'],
        additionalProperties: false,
        properties: {
            fund: {
                type: ['string', 'null'],
                description: 'A fund name, or null to publish for all funds.'
            },
            asOf: {type: 'string', format: 'date', description: 'The report date, as YYYY-MM-DD.'}
        }
    },
    guidance: 'Publishes a report to the PM pack. Always asks the user to confirm.',
    describe: ({fund, asOf}) => `Publish the report for ${fund ?? 'all funds'}, ${asOf}`,
    run: ({fund, asOf}) => {
        XH.track({category: 'Blueprints', message: 'Published to PM pack', data: {fund, asOf}});
        XH.successToast(
            `Published the report for ${fund ?? 'all funds'}, ${asOf}, to the PM pack.`
        );
    }
};

/** A client tool for the Architect: the tickers whose company name or symbol matches a query. */
export const lookupSymbolTool: ToolSpec = {
    name: 'toolbox.lookupSymbol',
    app: true,
    runsOn: 'client',
    summary: 'Find the tickers of companies in the portfolio data, by company name.',
    guidance:
        'Use it before writing a symbol you are not sure of, such as when the user names a ' +
        'company. Returns at most 10 matches; an empty list means the data does not hold it.',
    parameters: {
        type: 'object',
        required: ['query'],
        additionalProperties: false,
        properties: {query: {type: 'string', description: 'A company name, or part of one.'}}
    },
    execute: async ({query}) => {
        const q = (query as string)?.trim().toLowerCase();
        if (!q) throw new Error('Give a company name to look up.');
        return (await fetchInstrumentsAsync())
            .filter(it => it.name.toLowerCase().includes(q) || it.symbol.toLowerCase() === q)
            .slice(0, 10);
    }
};

/** The built-in registry, plus Toolbox's portfolio widgets, types, resolvers and renderers. */
export function createPortfolioRegistry(): BlueprintRegistry {
    return new BlueprintRegistry({
        widgets: [portfolioBuilderSpec],
        variableTypes: [fundType, portfolioType],
        resolvers: [userFundResolver],
        actions: [publishToPmPackAction],
        renderers: [tickerRenderer],
        tools: [lookupSymbolTool]
    });
}

/** The built-in registry, plus Toolbox's weather renderers. */
export function createWeatherRegistry(): BlueprintRegistry {
    return new BlueprintRegistry({renderers: [weatherIconRenderer]});
}

/** The built-in registry, plus everything Toolbox adds for any blueprint type. */
export function createToolboxRegistry(): BlueprintRegistry {
    return new BlueprintRegistry({
        widgets: [portfolioBuilderSpec],
        variableTypes: [fundType, portfolioType],
        resolvers: [userFundResolver],
        actions: [publishToPmPackAction],
        renderers: [tickerRenderer, weatherIconRenderer],
        tools: [lookupSymbolTool]
    });
}
