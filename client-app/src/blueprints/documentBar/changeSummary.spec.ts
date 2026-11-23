import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {describe, expect, it} from 'vitest';
import {changeCount, changeSummary} from './changeSummary';

const base: Blueprint = {
    root: 'dash',
    variables: {fund: {type: 'string'}, asOf: {type: 'date'}},
    sources: {positions: {dataset: 'positions'}} as Blueprint['sources'],
    elements: {
        dash: {component: 'dashCanvas', children: [{id: 'grid'}, {id: 'chart'}]},
        grid: {component: 'cubeGrid', config: {source: 'positions'}},
        chart: {component: 'chart', config: {source: 'positions'}}
    }
};

const edit = (fn: (bp: Blueprint) => void): Blueprint => {
    const ret = structuredClone(base);
    fn(ret);
    return ret;
};

describe('changeSummary', () => {
    it('says nothing changed for equal blueprints', () => {
        expect(changeSummary(base, structuredClone(base))).toEqual([]);
    });

    it('counts elements added, removed and changed, by kind', () => {
        const to = edit(bp => {
            bp.elements.stat = {component: 'statCard'};
            bp.elements.note = {component: 'callout'};
            bp.elements.dash.children.push({id: 'stat'}, {id: 'note'});
            delete bp.elements.chart;
            bp.elements.dash.children = bp.elements.dash.children.filter(it => it.id !== 'chart');
            bp.elements.grid.config.groupBy = ['sector'];
        });
        expect(changeSummary(base, to)).toEqual([
            '2 elements added',
            '1 element removed',
            '2 elements changed'
        ]);
    });

    it('counts variables and sources, and a rename once', () => {
        const to = edit(bp => {
            bp.variables.symbol = {type: 'string'};
            bp.variables.date = bp.variables.asOf;
            delete bp.variables.asOf;
            bp.sources.positions = {dataset: 'positions', params: {fund: {$var: 'fund'}}} as never;
        });
        expect(changeSummary(base, to, [{kind: 'variable', from: 'asOf', to: 'date'}])).toEqual([
            '1 variable added',
            '1 variable renamed',
            '1 source changed'
        ]);
    });

    it('notes a change outside the named sections', () => {
        expect(
            changeSummary(
                base,
                edit(bp => (bp.root = 'grid'))
            )
        ).toEqual(['Blueprint settings changed']);
    });

    it('reads a first publish against nothing', () => {
        expect(changeSummary(null, base)).toEqual([
            '3 elements added',
            '2 variables added',
            '1 source added'
        ]);
    });
});

describe('changeCount', () => {
    it('counts each change, as the summary lists them, not its lines', () => {
        const to = edit(bp => {
            bp.elements.grid.config.title = 'Grid';
            bp.elements.chart.config.title = 'Chart';
            bp.root = 'grid';
        });
        expect(changeSummary(base, to)).toEqual([
            '2 elements changed',
            'Blueprint settings changed'
        ]);
        expect(changeCount(base, to)).toBe(3);
    });

    it('counts nothing for equal blueprints', () => {
        expect(changeCount(base, structuredClone(base))).toBe(0);
    });
});
