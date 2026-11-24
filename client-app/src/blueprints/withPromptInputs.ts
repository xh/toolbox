import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';

/**
 * The blueprint with its root inside a titleless panel whose tbar holds a `variableInput` for each
 * prompted variable, so the user can change it. A blueprint with no prompts comes back as it is.
 */
export function withPromptInputs(bp: Blueprint): Blueprint {
    const variables = bp.variables ?? {},
        prompted = Object.keys(variables).filter(it => variables[it].setBy === 'prompt');
    if (!prompted.length) return bp;

    const inputs = Object.fromEntries(
        prompted.map(it => [`${it}Input`, {component: 'variableInput', config: {variable: it}}])
    );
    return {
        ...bp,
        root: 'page',
        elements: {
            page: {
                component: 'panel',
                tbar: Object.keys(inputs).map(id => ({id})),
                children: [{id: bp.root}]
            },
            ...inputs,
            ...bp.elements
        }
    };
}
