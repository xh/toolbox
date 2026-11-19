import {BlueprintRegistry} from '@xh/hoist-chat-kit/blueprint';
import type {ResolverSpec, VariableTypeSpec} from '@xh/hoist-chat-kit/blueprint';
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

/** The built-in registry, plus Toolbox's own variable types, resolvers and renderers. */
export function createToolboxRegistry(): BlueprintRegistry {
    return new BlueprintRegistry({variableTypes: [fundType], resolvers: [userFundResolver]});
}
