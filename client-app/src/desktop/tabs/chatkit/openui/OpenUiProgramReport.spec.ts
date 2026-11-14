// The inspector's reports are the lab's evidence of what a model's program did. A wrong report
// would send a reader after the wrong cause, so these cover each outcome it can state.
import {ChatMessage} from '@xh/hoist-chat-kit/core';
import {describe, expect, it} from 'vitest';
import {createOpenUiLabCatalog} from './OpenUiLabCatalog';
import {inspectOpenUiMessage} from './OpenUiProgramReport';

const catalog = createOpenUiLabCatalog(),
    inspect = (message: ChatMessage) => inspectOpenUiMessage(catalog, message);

/** A finished reply with the given text. */
function reply(text: string): ChatMessage {
    return new ChatMessage({role: 'assistant', content: text});
}

/** A fenced program, as the prompt asks the model to write one. */
function fenced(program: string): string {
    return '```openui-lang\n' + program + '\n```';
}

describe('inspectOpenUiMessage', () => {
    it('reports a program whose elements all render', () => {
        const program = [
                'root = Stack([lead, kpis])',
                'lead = Text("Q3 at a glance.")',
                'kpis = Metrics([{label: "Revenue", value: 1250000, format: "currency"}])'
            ].join('\n'),
            [report] = inspect(reply(`Here it is.\n\n${fenced(program)}`));

        expect(report).toMatchObject({index: 1, source: program, status: 'rendered'});
        expect(report.elements).toEqual([
            {id: 'root', component: 'stack', isPartial: false, readsState: false, errors: []},
            {id: 'lead', component: 'text', isPartial: false, readsState: false, errors: []},
            {id: 'kpis', component: 'metrics', isPartial: false, readsState: false, errors: []}
        ]);
    });

    it('reports one program per fence, in order', () => {
        const text = [
                fenced('root = Stack([a])\na = Text("One")'),
                'Then:',
                fenced('root = Stack([b])\nb = Text("Two")')
            ].join('\n\n'),
            reports = inspect(reply(text));

        expect(reports.map(it => it.index)).toEqual([1, 2]);
        expect(reports[1].source).toContain('"Two"');
    });

    it('reports an element with invalid props as a fallback, and the rest as rendered', () => {
        const program = [
                'root = Stack([lead, chart])',
                'lead = Text("Sales")',
                'chart = Chart("Sales", "donut", null, null, [{name: "Sales", data: [1, 2]}])'
            ].join('\n'),
            [report] = inspect(reply(fenced(program))),
            chart = report.elements.find(it => it.id === 'chart');

        expect(report.status).toBe('renderedWithIssues');
        expect(chart.errors.join(' ')).toContain('type');
        expect(report.elements.find(it => it.id === 'lead').errors).toEqual([]);
    });

    it('reports a call to a component that the catalog lacks', () => {
        const program = 'root = Stack([dial])\ndial = Gauge("Load", 0.7)',
            [report] = inspect(reply(fenced(program))),
            problems = [...report.errors, ...report.elements.flatMap(it => it.errors)];

        expect(report.status).not.toBe('rendered');
        expect(problems.join(' ')).toContain('Gauge');
    });

    it('lists a statement that the root does not reach, and a name that is never defined', () => {
        const program = [
                'root = Stack([lead, missing])',
                'lead = Text("Shown")',
                'extra = Text("Never shown")'
            ].join('\n'),
            [report] = inspect(reply(fenced(program)));

        expect(report.orphaned).toEqual(['extra']);
        expect(report.unresolved).toEqual(['missing']);
        expect(report.status).toBe('renderedWithIssues');
    });

    it('reports an element written with a named argument, and names the argument', () => {
        const program = [
                'root = Stack([row])',
                'row = Stack([lead], direction: "row")',
                'lead = Text("Row?")'
            ].join('\n'),
            [report] = inspect(reply(fenced(program))),
            row = report.elements.find(it => it.id === 'row');

        expect(row.errors.join(' ')).toContain("'direction'");
        expect(report.unresolved).toEqual(['direction']);
        expect(report.status).toBe('renderedWithIssues');
    });

    it('marks an element whose prop reads a $variable, and reports no error for that prop', () => {
        const program = [
                'root = Stack([pick, note])',
                '$region = "emea"',
                'pick = Select("region", ["emea", "apac"], "Region", null, null, null, $region)',
                'note = Text("Showing " + $region)'
            ].join('\n'),
            [report] = inspect(reply(fenced(program)));

        expect(report.status).toBe('rendered');
        expect(report.elements.find(it => it.id === 'note')).toMatchObject({
            readsState: true,
            errors: []
        });
    });

    it('still reports a wrong plain value in a program that runs with state', () => {
        const program = [
                'root = Stack([note, chart])',
                '$region = "emea"',
                'note = Text("Showing " + $region)',
                'chart = Chart("Sales", "donut", null, null, [{name: "Sales", data: [1, 2]}])'
            ].join('\n'),
            [report] = inspect(reply(fenced(program))),
            problems = [...report.errors, ...report.elements.flatMap(it => it.errors)];

        expect(report.status).toBe('renderedWithIssues');
        expect(problems.join(' ')).toContain('donut');
    });

    it('reports a fenced program with no root as failed', () => {
        const [report] = inspect(reply(fenced('lead = Text("No root")')));

        expect(report.status).toBe('failed');
        expect(report.errors.join(' ')).toContain('root');
    });

    it('reports a program still streaming, with its finished statements complete', () => {
        const text = '```openui-lang\nroot = Stack([lead, kpis])\nlead = Text("Done")\nkpis = Metr',
            message = new ChatMessage({
                role: 'assistant',
                status: 'streaming',
                parts: [{type: 'text', id: 't1', text, state: 'streaming'}]
            }),
            [report] = inspect(message);

        expect(report.status).toBe('streaming');
        expect(report.elements.find(it => it.id === 'lead')).toMatchObject({
            isPartial: false,
            errors: []
        });
    });

    it('reports nothing for a reply of prose alone, or for no reply', () => {
        expect(inspect(reply('P&L fell in two sectors.'))).toEqual([]);
        expect(inspect(null)).toEqual([]);
    });
});
