import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {describe, expect, it} from 'vitest';
import {compareRows} from './compareRows';

const from: Blueprint = {
    root: 'dash',
    variables: {fund: {type: 'string'}},
    elements: {
        dash: {component: 'dashboard', children: [{id: 'grid'}]},
        grid: {component: 'cubeGrid', config: {title: 'Positions', source: 'positions'}}
    }
};

describe('compareRows', () => {
    it('lists each change with its value before and after, by path', () => {
        const to = structuredClone(from);
        to.elements.grid.config.title = 'Book';
        to.elements.note = {component: 'callout'};
        to.elements.dash.children.push({id: 'note'});
        delete to.variables.fund;

        expect(compareRows(from, to)).toEqual([
            {path: '/variables/fund', change: 'removed', before: '{"type":"string"}', after: null},
            {
                path: '/elements/dash/children[note]',
                change: 'added',
                before: null,
                after: '{"id":"note"}'
            },
            {
                path: '/elements/grid/config/title',
                change: 'changed',
                before: '"Positions"',
                after: '"Book"'
            },
            {
                path: '/elements/note',
                change: 'added',
                before: null,
                after: '{"component":"callout"}'
            }
        ]);
    });

    it('keys an array of refs by id: one row per ref added or removed, and per key changed', () => {
        const a = {
                elements: {
                    dash: {
                        component: 'dashboard',
                        children: [
                            {id: 'p1', x: 0, y: 9, w: 6},
                            {id: 'p2', x: 6, y: 0, w: 6}
                        ]
                    }
                }
            } as Blueprint,
            b = structuredClone(a);
        b.elements.dash.children[0].y = 10;
        b.elements.dash.children.splice(1, 1, {id: 'p3', x: 6, y: 0, w: 3});

        expect(compareRows(a, b)).toEqual([
            {path: '/elements/dash/children[p1]/y', change: 'changed', before: '9', after: '10'},
            {
                path: '/elements/dash/children[p2]',
                change: 'removed',
                before: '{"id":"p2","x":6,"y":0,"w":6}',
                after: null
            },
            {
                path: '/elements/dash/children[p3]',
                change: 'added',
                before: null,
                after: '{"id":"p3","x":6,"y":0,"w":3}'
            }
        ]);
    });

    it('reads JSON Pointer escapes, and is empty for equal blueprints', () => {
        const a = {elements: {x: {component: 'c', config: {'a/b': 1}}}} as Blueprint,
            b = structuredClone(a);
        b.elements.x.config['a/b'] = 2;
        expect(compareRows(a, b)).toEqual([
            {path: '/elements/x/config/a~1b', change: 'changed', before: '1', after: '2'}
        ]);
        expect(compareRows(a, structuredClone(a))).toEqual([]);
    });
});
