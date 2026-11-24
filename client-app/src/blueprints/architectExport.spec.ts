import {describe, expect, it} from 'vitest';
import {endsTurn, exportFileName, lastTurnId, turnIdOf, turnNumber} from './architectExport';

const messages = [
    {id: 'u1', role: 'user'},
    {id: 'a1', role: 'assistant'},
    {id: 'a2', role: 'assistant'},
    {id: 'u2', role: 'user'},
    {id: 'a3', role: 'assistant'}
] as any[];

describe('exportFileName', () => {
    it('names the blueprint, the local time to the minute, and the kind', () => {
        const at = new Date(2026, 10, 23, 9, 5);
        expect(exportFileName('P3. A morning report', at, 'architect.json')).toBe(
            'p3-a-morning-report-20261123-0905-architect.json'
        );
        expect(exportFileName(null, at, 'scenario.json')).toBe(
            'blueprint-20261123-0905-scenario.json'
        );
        expect(exportFileName('W1', at, 'architect.json', 3)).toBe(
            'w1-20261123-0905-turn3-architect.json'
        );
    });
});

describe('turns', () => {
    it("finds a message's turn by the user message before it", () => {
        expect(turnIdOf(messages, 'a2')).toBe('u1');
        expect(turnIdOf(messages, 'u2')).toBe('u2');
        expect(turnIdOf(messages, 'a3')).toBe('u2');
        expect(turnIdOf(messages, 'nope')).toBeNull();
    });

    it("marks a turn's last reply", () => {
        expect(['a1', 'a2', 'a3', 'u1'].map(id => endsTurn(messages, id))).toEqual([
            false,
            true,
            true,
            false
        ]);
    });

    it('numbers a turn from 1, in order', () => {
        expect(turnNumber(messages, 'u2')).toBe(2);
    });

    it('finds the last turn', () => {
        expect(lastTurnId(messages)).toBe('u2');
        expect(lastTurnId([])).toBeNull();
    });
});
