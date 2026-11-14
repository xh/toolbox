// The replay page is the lab's fixed bench: a reader trusts that its scripted programs are
// valid, so that anything odd on screen is the kit's doing. These check each program against
// the lab's catalog.
import {ChatMessage} from '@xh/hoist-chat-kit/core';
import {describe, expect, it} from 'vitest';
import {createOpenUiLabCatalog} from './OpenUiLabCatalog';
import {inspectOpenUiMessage} from './OpenUiProgramReport';
import {OPEN_UI_REPLAY_SCENARIOS} from './OpenUiReplay';

const catalog = createOpenUiLabCatalog();

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

const SLIPS_PROMPT = 'Replay slips a model can make: some the format corrects, some it reports.';

function inspect(prompt: string) {
    const {reply} = OPEN_UI_REPLAY_SCENARIOS.find(it => it.prompt === prompt);
    return inspectOpenUiMessage(
        catalog,
        new ChatMessage({role: 'assistant', content: reply(TOOL_OUTPUTS)})
    );
}

describe('OPEN_UI_REPLAY_SCENARIOS', () => {
    const valid = OPEN_UI_REPLAY_SCENARIOS.filter(it => it.prompt !== SLIPS_PROMPT);

    it.each(valid.map(it => it.prompt))('writes a program that renders in full: %s', prompt => {
        const reports = inspect(prompt);
        expect(reports.length).toBeGreaterThan(0);
        reports.forEach(report =>
            expect(report).toMatchObject({
                status: 'rendered',
                errors: [],
                unresolved: [],
                orphaned: []
            })
        );
    });

    it('keeps its slips, for the inspector to report', () => {
        const [report] = inspect(SLIPS_PROMPT),
            failed = report.elements.filter(it => it.errors.length).map(it => it.id);

        expect(report.status).toBe('renderedWithIssues');
        // The named argument and the unknown component fall back. The parser drops the bad
        // value, and says so. The card with one action in place of a list renders.
        expect(failed).toEqual(['row', 'gauge']);
        expect(report.errors.join(' ')).toContain('elements.margin');
        expect(report.unresolved).toEqual(['direction']);
        expect(report.orphaned).toEqual(['note']);
    });

    it('gives each scenario its own prompt, as a message selects one by its text', () => {
        const prompts = OPEN_UI_REPLAY_SCENARIOS.map(it => it.prompt);
        expect(new Set(prompts).size).toBe(prompts.length);
    });
});
