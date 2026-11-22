import {describe, expect, it} from 'vitest';
import {editCardState, withEditCards} from './architectEditCard';

const edit = (version: number, over = {}) => ({
    version,
    author: 'architect',
    description: `Edit ${version}`,
    ops: [],
    ...over
});

describe('editCardState', () => {
    it('lets the latest Architect edit be undone', () => {
        expect(editCardState([edit(1), edit(2)], 2, 'Edit 2', true)).toEqual({
            found: true,
            undone: false,
            canUndo: true,
            reason: null
        });
    });

    it('refuses an edit with later edits on top', () => {
        expect(editCardState([edit(1), edit(2)], 1, 'Edit 1', true)).toMatchObject({
            canUndo: false,
            reason: 'Undo the later edits first, from the bar or History.'
        });
    });

    it('shows an edit undone, and lets it go again once redone', () => {
        const h = [edit(1), edit(2, {author: 'user', undoes: 1, description: 'Undo: Edit 1'})];
        expect(editCardState(h, 1, 'Edit 1', true)).toMatchObject({undone: true, canUndo: false});
        h.push(edit(3, {author: 'user', redoes: 1, description: 'Redo: Edit 1'}));
        expect(editCardState(h, 1, 'Edit 1', true)).toMatchObject({undone: false, canUndo: true});
    });

    it('matches nothing from before the blueprint last opened, even at the same version', () => {
        expect(editCardState([edit(1, {description: 'Other'})], 1, 'Edit 1', true)).toMatchObject({
            found: false,
            canUndo: false,
            reason: 'Made before the blueprint last opened.'
        });
    });

    it('refuses while undo is not allowed, as in run mode or an Architect turn', () => {
        expect(editCardState([edit(1)], 1, 'Edit 1', false)).toMatchObject({
            canUndo: false,
            reason: 'Undo needs design mode, and waits for the Architect to finish.'
        });
    });
});

describe('withEditCards', () => {
    it('shows edit_blueprint calls inline with a card, and leaves other tools alone', () => {
        const tools = withEditCards(
            [{name: 'edit_blueprint'}, {name: 'read_blueprint'}],
            null,
            () => {}
        );
        expect(tools[0]).toMatchObject({name: 'edit_blueprint', display: 'inline'});
        expect(tools[0].renderer).toBeTypeOf('function');
        expect(tools[1]).toEqual({name: 'read_blueprint'});
    });
});
