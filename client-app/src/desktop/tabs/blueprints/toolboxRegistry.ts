import {BlueprintRegistry} from '@xh/hoist-chat-kit/blueprint';
import type {RendererSpec, ResolverSpec, VariableTypeSpec} from '@xh/hoist-chat-kit/blueprint';
import {span} from '@xh/hoist/cmp/layout';
import {XH} from '@xh/hoist/core';
import {fundInput} from './FundInput';

export const fundType: VariableTypeSpec = {
    name: 'fund',
    app: true,
    matches: 'string',
    guidance:
        "A fund's identifier, which in Toolbox is its name, such as 'Oak Mount'. Its prompt " +
        "input shows each fund's name and AUM, and supplies its own choices.",
    input: props => fundInput(props)
};

export const userFundResolver: ResolverSpec = {
    name: 'userFund',
    app: true,
    returns: 'fund',
    args: {},
    guidance: "The current user's own fund.",
    resolve: () => XH.getPref('blueprintsFund')
};

/** A symbol's root ticker in bold, with any contract or bond detail, such as `FUT SEP27`, muted. */
export const tickerRenderer: RendererSpec = {
    name: 'ticker',
    app: true,
    appliesTo: {kinds: ['ticker']},
    config: {},
    guidance: 'Draws a symbol with its root ticker emphasized. The default for the ticker kind.',
    render: value => {
        if (value == null) return null;
        const [root, ...rest] = String(value).split(' ');
        return span({
            className: 'tb-ticker',
            items: [
                span({className: 'tb-ticker__root', item: root}),
                rest.length
                    ? span({className: 'tb-ticker__detail', item: ` ${rest.join(' ')}`})
                    : null
            ]
        });
    }
};

/** The built-in registry, plus Toolbox's own variable types, resolvers and renderers. */
export function createToolboxRegistry(): BlueprintRegistry {
    return new BlueprintRegistry({
        variableTypes: [fundType],
        resolvers: [userFundResolver],
        renderers: [tickerRenderer]
    });
}
