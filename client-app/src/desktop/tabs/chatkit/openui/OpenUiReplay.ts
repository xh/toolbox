import type {ChatSuggestion} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {ScriptedChatTransport, textEvents, toolCallEvents} from '@xh/hoist-chat-kit/transport';
import type {PlainObject} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {last} from 'lodash';
import type {ReactElement} from 'react';

/**
 * A reply for the lab's replay page to stream, in place of a model: the data tools to call first,
 * as a model would, and the reply text, which holds one or more OpenUI Lang programs.
 */
export interface OpenUiReplayScenario {
    /** The message that runs the scenario, offered as a suggestion. */
    prompt: string;
    icon: ReactElement;
    /**
     * Rounds of calls to the lab's data tools, which the chat runs before the reply streams. Each
     * round is a step of the turn, and gets the output of every call before it, in order.
     */
    toolRounds?: Array<(outputs: PlainObject[]) => OpenUiReplayToolCall[]>;
    /** The reply text, given the output of every tool call, in order. */
    reply: (outputs: PlainObject[]) => string;
}

/** A scripted call to one of the lab's data tools. */
export interface OpenUiReplayToolCall {
    name: string;
    input: PlainObject;
}

/**
 * A transport that replays OpenUI Lang with no model and no server relay. It streams each reply
 * through the same catalog, text format and inspector as the live page, so a program can be
 * checked again and again at no cost.
 *
 * A message that matches a scenario's prompt runs that scenario. Any other message is streamed
 * back as the reply itself, so a reader can paste what a live model wrote and watch it render.
 */
export function createOpenUiReplayTransport(): ScriptedChatTransport {
    return new ScriptedChatTransport({
        delayMs: 12,
        respond: (request, {stepIndex, userMessage}) => {
            const text = userMessage?.text ?? '',
                scenario = OPEN_UI_REPLAY_SCENARIOS.find(it => it.prompt === text);
            if (!scenario) return textEvents(text);

            const {toolRounds = [], reply} = scenario,
                outputs = last(request.messages).toolCalls.map(it => it.output);
            return stepIndex < toolRounds.length
                ? toolRounds[stepIndex](outputs).map(({name, input}) => toolCallEvents(name, input))
                : textEvents(reply(outputs));
        }
    });
}

export const OPEN_UI_REPLAY_SCENARIOS: OpenUiReplayScenario[] = [
    {
        prompt: 'Replay a portfolio brief over real positions, shown by reference.',
        icon: Icon.portfolio(),
        toolRounds: [() => [{name: 'query_positions', input: {groupBy: ['sector']}}]],
        reply: ([{artifact, summary}]) =>
            [
                'Here is the portfolio by sector.',
                '',
                fence(
                    'root = Stack([lead, totals, charts, table], "column", "medium", "Portfolio by sector")',
                    `lead = Text("P&L and market value, totaled over **${summary.positions} positions**.")`,
                    `totals = Metrics([{label: "P&L", value: ${summary.pnl}, format: "currency", decimals: 0}, {label: "Market value", value: ${summary.mktVal}, format: "currency", decimals: 0}, {label: "Sectors", value: ${summary.groups}}])`,
                    'charts = Stack([pnlChart, valueChart], "row")',
                    `pnlChart = DataChart("P&L by sector", "${artifact}", null, "pnl|desc", null, null, "millions", "column", "sector", ["pnl"], null, null, true)`,
                    `valueChart = DataChart("Market value by sector", "${artifact}", null, "mktVal|desc", null, null, "millions", "bar", "sector", ["mktVal"])`,
                    `table = DataGrid("Sectors", "${artifact}", ["sector", "pnl", "mktVal", "positions"], "pnl|desc")`
                ),
                '',
                'The charts and the table read the same artifact. The program holds only its id.'
            ].join('\n')
    },
    {
        prompt: 'Replay a row of fund cards, each with a follow-up action.',
        icon: Icon.fund(),
        toolRounds: [() => [{name: 'query_positions', input: {groupBy: ['fund']}}]],
        reply: ([{firstRows}]) => {
            const names = firstRows.map((_, idx) => `fund${idx + 1}`);
            return fence(
                'root = Stack([lead, cards])',
                'lead = Text("One card per fund. Each button sends a follow-up message.")',
                `cards = Stack([${names.join(', ')}], "row", "small")`,
                ...firstRows.map(
                    ({fund, pnl, mktVal, positions}, idx) =>
                        `${names[idx]} = Card("${fund}", "Fund", [{label: "P&L", value: ${pnl}, format: "currency", decimals: 0}, {label: "Market value", value: ${mktVal}, format: "currency", decimals: 0}, {label: "Positions", value: ${positions}}], [@ToAssistant("Show the worst symbols of ${fund}.", {fund: "${fund}"})])`
                )
            );
        }
    },
    {
        prompt: 'Replay a price chart of the most profitable symbol, from two rounds of tool calls.',
        icon: Icon.chartLine(),
        toolRounds: [
            () => [{name: 'query_positions', input: {groupBy: ['symbol'], limit: 1}}],
            ([top]) => [
                {name: 'get_price_history', input: {symbol: top.firstRows[0].symbol, days: 90}}
            ]
        ],
        reply: ([top, {artifact, summary}]) =>
            [
                `**${summary.symbol}** is the most profitable symbol, with a P&L of ${top.firstRows[0].pnl}.`,
                '',
                fence(
                    `root = Stack([stats, close, volume], "column", "medium", "${summary.symbol}: ${summary.from} to ${summary.to}")`,
                    `stats = Metrics([{label: "Last close", value: ${summary.lastClose}, format: "currency", delta: ${summary.change}, deltaFormat: "percent", deltaLabel: "over the period"}, {label: "High", value: ${summary.high}, format: "currency"}, {label: "Low", value: ${summary.low}, format: "currency"}, {label: "Avg volume", value: ${summary.avgVolume}}])`,
                    `close = DataChart("Close", "${artifact}", null, null, null, null, null, "line", "day", ["close"])`,
                    `volume = DataChart("Volume", "${artifact}", null, null, null, null, "thousands", "column", "day", ["volume"])`
                )
            ].join('\n')
    },
    {
        prompt: 'Replay a program with four mistakes a model can make.',
        icon: Icon.warning(),
        reply: () =>
            [
                'Each mistake below shows in the inspector.',
                '',
                fence(
                    // Named arguments: the parser reads `direction` as a reference to nothing.
                    'root = Stack([lead, refresh, margin, trend], direction: "row")',
                    'lead = Text("Four mistakes: a named argument, an unknown component, a bad value and an unused statement.")',
                    // A component that the catalog lacks.
                    'refresh = Button("Refresh", @ToAssistant("Refresh the data"))',
                    // A value outside the schema of a prop.
                    'margin = Metrics([{label: "Margin", value: 0.184, format: "ratio"}])',
                    'trend = Chart("Trend", "line", {categories: ["Jan", "Feb", "Mar"]}, null, [{name: "Sales", data: [182000, 205000, 231000]}])',
                    // A statement that the root never reaches.
                    'note = Text("No statement uses this one.")'
                )
            ].join('\n')
    }
];

/** The scenarios as suggestions for the replay page's empty chat. */
export const OPEN_UI_REPLAY_SUGGESTIONS: ChatSuggestion[] = OPEN_UI_REPLAY_SCENARIOS.map(
    ({prompt, icon}) => ({text: prompt, icon})
);

//------------------
// Implementation
//------------------
/** Statements as a fenced program, as the format's prompt asks a model to write one. */
function fence(...statements: string[]): string {
    return ['```openui-lang', ...statements, '```'].join('\n');
}
