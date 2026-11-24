import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {describe, expect, it} from 'vitest';
import {withPromptInputs} from './withPromptInputs';

const grid: Blueprint['elements'][string] = {component: 'cubeGrid', config: {source: 'positions'}};

describe('withPromptInputs', () => {
    it("puts the root in a panel with an input for each prompt in the panel's tbar", () => {
        const bp = withPromptInputs({
            variables: {
                fund: {type: 'string', setBy: 'prompt'},
                asOf: {type: 'localDate', setBy: 'prompt'},
                filter: {type: 'filter', setBy: 'action'}
            },
            root: 'grid',
            elements: {grid}
        } as Blueprint);
        expect(bp.root).toBe('page');
        expect(bp.elements).toEqual({
            page: {
                component: 'panel',
                tbar: [{id: 'fundInput'}, {id: 'asOfInput'}],
                children: [{id: 'grid'}]
            },
            fundInput: {component: 'variableInput', config: {variable: 'fund'}},
            asOfInput: {component: 'variableInput', config: {variable: 'asOf'}},
            grid
        });
    });

    it('leaves a blueprint with no prompts as it is', () => {
        const bp = {root: 'grid', elements: {grid}} as Blueprint;
        expect(withPromptInputs(bp)).toBe(bp);
    });
});
