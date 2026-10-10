import {describe, expect, it} from 'vitest';
import {compareCells} from './CellProbe';
import type {CellReading} from './CellProbe';

// A right-aligned cell with 3px between its text and its right edge.
function reading(width: number, left: number): CellReading {
    return {
        text: '-0.001b',
        sign: 'rgb(0, 0, 0)',
        placeholder: false,
        offsets: {left, right: 3, middle: -0.5},
        width
    };
}

describe('compareCells', () => {
    it('passes cells whose autosized widths round 1px apart', () => {
        expect(compareCells(reading(63, 18.3), reading(62, 17.3))).toEqual([]);
    });

    it('reports a width gap over 1px', () => {
        const checks = compareCells(reading(64, 19.3), reading(62, 17.3)).map(it => it.check);
        expect(checks).toContain('width');
    });

    it('reports text that moves further than the width gap', () => {
        const checks = compareCells(reading(63, 18.3), reading(63, 17.3)).map(it => it.check);
        expect(checks).toEqual(['alignment']);
    });
});
