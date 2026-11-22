import {describe, expect, it} from 'vitest';
import {editTarget, historyTimeline} from './historyTimeline';

const edit = (version: number, over = {}) => ({
    version,
    author: 'user',
    description: `Edit ${version}`,
    ops: [{op: 'set' as const, path: `/elements/e${version}/config/title`, value: 'x'}],
    ...over
});

describe('historyTimeline', () => {
    it('merges edits and publishes, newest first, by time', () => {
        const rows = historyTimeline(
            [edit(1), edit(2)],
            [{version: 3, published: 150, publishedBy: 'jdoe', renames: []}],
            {1: 100, 2: 200}
        );
        expect(rows.map(it => it.id)).toEqual(['edit-2', 'publish-3', 'edit-1']);
        expect(rows[1]).toMatchObject({
            kind: 'publish',
            description: 'Published v3',
            author: 'jdoe'
        });
    });

    it('folds undo and redo into the original edit: struck while undone', () => {
        const rows = (history, stamps) => historyTimeline(history, [], stamps);
        const h = [edit(1), edit(2, {undoes: 1, description: 'Undo: Edit 1'})];
        expect(rows(h, {1: 1, 2: 2}).map(it => [it.version, it.undone])).toEqual([[1, true]]);

        h.push(edit(3, {redoes: 1, description: 'Redo: Edit 1'}));
        expect(rows(h, {1: 1, 2: 2, 3: 3}).map(it => [it.version, it.undone])).toEqual([
            [1, false]
        ]);

        // A second undo reverts the redo, which stands for the original.
        h.push(edit(4, {undoes: 3, description: 'Undo: Edit 1'}));
        expect(rows(h, {1: 1, 2: 2, 3: 3, 4: 4}).map(it => [it.version, it.undone])).toEqual([
            [1, true]
        ]);
    });
});

describe('editTarget', () => {
    it('names the element, variable or source an edit touched first', () => {
        expect(editTarget([{op: 'set', path: '/elements/grid/config/x', value: 1}])).toEqual({
            kind: 'element',
            id: 'grid'
        });
        expect(
            editTarget([{op: 'addElement', id: 'chart', element: {component: 'chart'}}])
        ).toEqual({
            kind: 'element',
            id: 'chart'
        });
        expect(editTarget([{op: 'remove', path: '/variables/asOf'}])).toEqual({
            kind: 'variable',
            id: 'asOf'
        });
        expect(
            editTarget([{op: 'renameId', kind: 'source', from: 'pos', to: 'positions'}])
        ).toEqual({kind: 'source', id: 'positions'});
        expect(editTarget([{op: 'removeElement', id: 'gone'}])).toBeNull();
        expect(editTarget([{op: 'set', path: '/root', value: 'x'}])).toBeNull();
    });
});
