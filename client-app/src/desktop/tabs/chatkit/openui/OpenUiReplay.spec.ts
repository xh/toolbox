// The replay page is the lab's fixed bench: a reader trusts that its scripted programs are
// valid, so that anything odd on screen is the kit's doing. These check each program against
// the lab's catalog.
import {ChatMessage} from '@xh/hoist-chat-kit/core';
import {describe, expect, it} from 'vitest';
import {createOpenUiLabCatalog, OPEN_UI_FORMAT_OPTIONS} from './OpenUiLabCatalog';
import {OpenUiProgramInspector} from './OpenUiProgramReport';
import {OPEN_UI_REPLAY_SCENARIOS} from './OpenUiReplay';

const inspector = new OpenUiProgramInspector(createOpenUiLabCatalog(), OPEN_UI_FORMAT_OPTIONS);

// What the data tools return, in the shape each scenario reads: a first call that totals
// positions, then a price history.
const TOOL_OUTPUTS = [
    {
        artifact: 'positions-1',
        summary: {groups: 2, positions: 4, pnl: -230, mktVal: 5700},
        firstRows: [
            {symbol: 'AAA', fund: 'Oak Mount', pnl: 60, mktVal: 1500, positions: 2},
            {symbol: 'BBB', fund: 'Red River', pnl: -290, mktVal: -4200, positions: 2}
        ]
    },
    {
        artifact: 'prices-2',
        summary: {
            symbol: 'AAA',
            from: '2026-01-05',
            to: '2026-01-07',
            lastClose: 15,
            change: 0.5,
            high: 16,
            low: 9,
            avgVolume: 2000
        }
    }
];

const MISTAKES_PROMPT = 'Replay a program with four mistakes a model can make.';

function inspect(prompt: string) {
    const {reply} = OPEN_UI_REPLAY_SCENARIOS.find(it => it.prompt === prompt);
    return inspector.inspectMessage(
        new ChatMessage({role: 'assistant', content: reply(TOOL_OUTPUTS)})
    );
}

describe('OPEN_UI_REPLAY_SCENARIOS', () => {
    const valid = OPEN_UI_REPLAY_SCENARIOS.filter(it => it.prompt !== MISTAKES_PROMPT);

    it.each(valid.map(it => it.prompt))('writes a program that renders in full: %s', prompt => {
        const reports = inspect(prompt);
        expect(reports).toHaveLength(1);
        expect(reports[0]).toMatchObject({
            status: 'rendered',
            errors: [],
            unresolved: [],
            orphaned: []
        });
    });

    it('keeps its four mistakes, for the inspector to report', () => {
        const [report] = inspect(MISTAKES_PROMPT),
            failed = report.elements.filter(it => it.errors.length).map(it => it.id);

        expect(report.status).toBe('renderedWithIssues');
        // The unknown component falls back. The parser drops the bad value, and says so.
        expect(failed).toEqual(['refresh']);
        expect(report.errors.join(' ')).toContain('elements.margin');
        expect(report.unresolved).toEqual(['direction']);
        expect(report.orphaned).toEqual(['note']);
    });

    it('gives each scenario its own prompt, as a message selects one by its text', () => {
        const prompts = OPEN_UI_REPLAY_SCENARIOS.map(it => it.prompt);
        expect(new Set(prompts).size).toBe(prompts.length);
    });
});
