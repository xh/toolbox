import {describe, expect, it} from 'vitest';
import {publishState} from './publishState';

const incomplete = {
        code: 'config.incomplete',
        severity: 'warning',
        path: '/elements/chart1/config/y',
        message: 'chart is unfinished: Y needs at least 1 item'
    },
    warning = {
        code: 'box.alignCollapses',
        severity: 'warning',
        path: '/elements/row/config/align',
        message: 'Align has no effect on a box that fills.'
    },
    error = {code: 'source.unknown', severity: 'error', path: '/sources/x', message: 'No x.'};

describe('publishState', () => {
    it('blocks publishing while a widget is unfinished, naming it', () => {
        const state = publishState([incomplete], ['chart1']);
        expect(state.disabled).toBe(true);
        expect(state.tooltip).toBe('Finish chart1 to publish');
        expect(state.finish).toEqual({
            text: 'Finish chart1 before you publish.',
            messages: [incomplete.message]
        });
        expect(state.warning).toBeNull();
    });

    it('offers publish anyway for a plain warning, and does not count an unfinished widget', () => {
        const state = publishState([warning], []);
        expect(state.disabled).toBe(false);
        expect(state.finish).toBeNull();
        expect(state.warning).toBe(
            `1 warning: ${warning.message} Publish anyway, or fix it first.`
        );
    });

    it('counts several plain warnings, naming the first', () => {
        const state = publishState([warning, {...warning, message: 'Another.'}], []);
        expect(state.warning).toBe(
            `2 warnings: ${warning.message} And 1 more. Publish anyway, or fix them first.`
        );
    });

    it('blocks publishing on errors before anything else', () => {
        const state = publishState([error, error, incomplete], ['chart1']);
        expect(state.disabled).toBe(true);
        expect(state.tooltip).toBe('Fix 2 errors to publish');
    });

    it('allows a clean draft', () => {
        expect(publishState([], [])).toEqual({
            disabled: false,
            tooltip: null,
            finish: null,
            warning: null
        });
    });
});
