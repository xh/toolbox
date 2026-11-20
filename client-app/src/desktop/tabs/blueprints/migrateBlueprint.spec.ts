import type {PlainObject} from '@xh/hoist/core';
import {describe, expect, it} from 'vitest';
import {migrateBlueprint} from './migrateBlueprint';

const grid = (config: PlainObject) => ({root: 'g', elements: {g: {component: 'cubeGrid', config}}});

describe('migrating a stored blueprint', () => {
    it("moves a columnState entry's format and renderer into columns, keyed by field", () => {
        const bp = grid({
            columnState: [
                'mktVal',
                {field: 'delta', format: {name: 'greek', scale: 'thousands'}},
                {field: 'pnlDay', renderer: 'delta', width: 90}
            ]
        });
        expect(migrateBlueprint(bp).elements.g.config).toEqual({
            columnState: ['mktVal', 'delta', {field: 'pnlDay', width: 90}],
            columns: {
                delta: {format: {name: 'greek', scale: 'thousands'}},
                pnlDay: {renderer: 'delta'}
            }
        });
    });

    it('keeps an existing columns entry over what it moves', () => {
        const bp = grid({
            columnState: [{field: 'delta', format: {precision: 0}}],
            columns: {delta: {format: {precision: 2}, headerName: 'Δ'}}
        });
        expect(migrateBlueprint(bp).elements.g.config.columns).toEqual({
            delta: {format: {precision: 2}, headerName: 'Δ'}
        });
    });

    it('returns a current blueprint unchanged, and passes null through', () => {
        const bp = grid({columnState: ['mktVal', {field: 'pnlDay', width: 90}]});
        expect(migrateBlueprint(bp)).toBe(bp);
        expect(migrateBlueprint(null)).toBeNull();
    });
});
