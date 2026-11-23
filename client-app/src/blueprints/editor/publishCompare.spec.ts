import type {BlueprintDiff, BlueprintPublish} from '@xh/hoist-chat-kit/blueprint';
import {describe, expect, it} from 'vitest';
import {diffRows, renamesBetween} from './publishCompare';

const rename = (from: string, to: string) => ({kind: 'element' as const, from, to}),
    publish = (version: number, renames = []): BlueprintPublish =>
        ({version, published: version, renames}) as BlueprintPublish,
    publishes = [
        publish(1, [rename('a', 'b')]),
        publish(2, [rename('b', 'c')]),
        publish(3, [rename('x', 'y')])
    ];

describe('renamesBetween', () => {
    it("takes each later publish's renames, in order, up to the version compared", () => {
        expect(renamesBetween(publishes, 1, 2, [])).toEqual([rename('b', 'c')]);
        expect(renamesBetween(publishes, 1, 3, [])).toEqual([rename('b', 'c'), rename('x', 'y')]);
    });

    it('adds the draft pending renames when comparing against the draft', () => {
        expect(renamesBetween(publishes, 2, 'draft', [rename('y', 'z')])).toEqual([
            rename('x', 'y'),
            rename('y', 'z')
        ]);
    });
});

describe('diffRows', () => {
    const empty = {added: [], removed: [], renamed: [], changed: []},
        diff: BlueprintDiff = {
            elements: {
                added: ['newChart'],
                removed: ['oldGrid'],
                renamed: [{from: 'grid', to: 'posGrid'}],
                changed: [{id: 'posGrid', paths: ['/config/title', '/config/sortBy']}]
            },
            sources: {...empty, changed: [{id: 'positions', paths: ['/params/asOf']}]},
            variables: empty,
            presets: empty,
            formats: empty,
            other: ['root'],
            isEmpty: false
        };

    it('lists each change by part, the parts in order, with the element or source it names', () => {
        expect(diffRows(diff)).toEqual([
            {kind: 'element', change: 'added', id: 'newChart', text: 'newChart'},
            {kind: 'element', change: 'removed', id: 'oldGrid', text: 'oldGrid'},
            {kind: 'element', change: 'renamed', id: 'posGrid', text: 'grid → posGrid'},
            {
                kind: 'element',
                change: 'changed',
                id: 'posGrid',
                text: 'posGrid: config/title, config/sortBy'
            },
            {kind: 'source', change: 'changed', id: 'positions', text: 'positions: params/asOf'},
            {kind: 'other', change: 'changed', id: null, text: 'root'}
        ]);
    });

    it('lists nothing when nothing differs', () => {
        expect(
            diffRows({
                elements: empty,
                sources: empty,
                variables: empty,
                presets: empty,
                formats: empty,
                other: [],
                isEmpty: true
            })
        ).toEqual([]);
    });
});
