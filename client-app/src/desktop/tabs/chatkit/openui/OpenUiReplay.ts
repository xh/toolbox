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
        prompt: 'Replay a treemap of the funds, sized by market value and colored by P&L.',
        icon: Icon.treeMap(),
        toolRounds: [() => [{name: 'query_positions', input: {groupBy: ['fund']}}]],
        reply: ([{firstRows}]) =>
            fence(
                'root = Stack([lead, map])',
                'lead = Callout("primary", "Read the colors", "A box is **green** where the fund made money and **red** where it lost.")',
                `map = Treemap("Funds by market value", [${firstRows
                    .map(
                        ({fund, mktVal, pnl}) =>
                            `{label: "${fund}", value: ${Math.abs(mktVal)}, heat: ${pnl}}`
                    )
                    .join(', ')}], "currency", 0, "P&L", "currency")`
            )
    },
    {
        prompt: 'Replay each display component on its own: callouts, badges, a divider, a section, tabs, a treemap and metrics.',
        icon: Icon.layout(),
        reply: () =>
            fence(
                'root = Stack([note, ok, warn, bad, plain, rule1, tags, rule2, group, views, map, kpis])',
                'note = Callout("primary", "A note", "Takes **bold**, *italics* and [a link](https://xh.io). This sentence runs long, to show how the text of a callout wraps in a narrow chat.")',
                'ok = Callout("success", "Reconciled", "All **9 sectors** tie out to the ledger.")',
                'warn = Callout("warning", "Limit breach", "VaR is **12% over** its limit on the Rates desk.")',
                'bad = Callout("danger", null, "The price feed is down. This callout has no title.")',
                'plain = Callout("none", "Neutral", "The none intent has no icon and no tint.")',
                'rule1 = Divider()',
                'tags = Badges([{label: "Tier 1", intent: "success"}, {label: "USD"}, {label: "Watchlist", intent: "warning"}, {label: "Breach", intent: "danger"}, {label: "Rates", intent: "primary"}, {label: "A neutral badge with a longer label"}, {label: "Emerging Markets"}, {label: "Hedged", intent: "success"}, {label: "Illiquid", intent: "warning"}, {label: "Restricted", intent: "danger"}, {label: "Model: Beckett", intent: "primary"}, {label: "Reviewed"}])',
                'rule2 = Divider()',
                'group = Section([groupText], "A section", "primary", true)',
                'groupText = Text("A bordered group under a title. Click the title to collapse it.")',
                'views = Tabs([first, second], ["First tab", "Second tab"])',
                'first = Text("The content of the first tab.")',
                'second = Text("The second tab is taller.\\n\\nIt has a second paragraph, so the tabs grow when it shows.\\n\\nAnd a third.")',
                'map = Treemap("Exposure by desk", [{label: "Rates", value: 4200000, heat: 0.012}, {label: "Credit", value: 2600000, heat: -0.008}, {label: "FX", value: 1100000}, {label: "Equities", value: 1900000, heat: 0.031}, {label: "Commodities", value: 700000, heat: -0.022}], "currency", 0, "Day change", "percent")',
                'kpis = Metrics([{label: "Revenue", value: 1250000, format: "currency", decimals: 0, delta: 0.042, deltaFormat: "percent", deltaLabel: "vs Q2"}, {label: "Costs", value: 830000, format: "currency", decimals: 0, delta: 0.08, deltaFormat: "percent", deltaLabel: "vs Q2", invert: true}, {label: "Margin", value: 0.184, format: "percent", delta: -0.012, deltaLabel: "vs Q2"}, {label: "Open issues", value: 7, intent: "warning"}, {label: "Breaches", value: 2, intent: "danger"}])'
            )
    },
    {
        prompt: 'Replay nested layouts: tabs in a section, a chart and a treemap in tabs, tabs in a row, and a collapsed section.',
        icon: Icon.treeList(),
        reply: () =>
            fence(
                'root = Stack([inSection, row, hidden, more])',
                'inSection = Section([views], "Tabs in a section", null, true)',
                'views = Tabs([trend, mix, rows], ["Chart", "Treemap", "Data"])',
                `trend = ${REVENUE_CHART}`,
                'mix = Treemap("Revenue by region", [{label: "Americas", value: 310000, heat: 0.06}, {label: "EMEA", value: 205000, heat: -0.02}, {label: "APAC", value: 103000, heat: 0.11}], "currency", 0, "Growth", "percent")',
                'rows = Grid("Revenue by month", [{field: "month"}, {field: "revenue", type: "number", format: "currency", decimals: 0}], null, [{month: "Jan", revenue: 182000}, {month: "Feb", revenue: 205000}, {month: "Mar", revenue: 231000}])',
                'row = Stack([side, rule, facts], "row")',
                'side = Tabs([summary, detail], ["Summary", "Detail"])',
                'summary = Text("Tabs in a row stack share the width with their siblings.")',
                'detail = Chart("A chart in a later tab", "line", {categories: ["Jan", "Feb", "Mar"]}, null, [{name: "Margin", data: [0.16, 0.17, 0.184]}])',
                'rule = Divider()',
                'facts = Metrics([{label: "Revenue", value: 618000, format: "currency", decimals: 0}, {label: "Margin", value: 0.184, format: "percent"}])',
                'hidden = Section([late], "Starts collapsed, with a chart inside", "warning", true, true)',
                `late = ${REVENUE_CHART}`,
                'more = Section([moreText], "A second collapsed section", null, true, true)',
                'moreText = Text("Several collapsible sections in a column read as an accordion.")'
            )
    },
    {
        prompt: 'Replay edge cases: treemaps with no heat, flat heat and no values, and tabs with long titles.',
        icon: Icon.experiment(),
        reply: () =>
            fence(
                'root = Stack([maps, zero, marked, wide])',
                'maps = Stack([noHeat, flatHeat], "row")',
                'noHeat = Treemap("No heat", [{label: "Rates", value: 40}, {label: "Credit", value: 25}, {label: "FX", value: 20}])',
                'flatHeat = Treemap("All heats zero", [{label: "Rates", value: 3, heat: 0}, {label: "Credit", value: 2, heat: 0}])',
                'zero = Treemap("All values zero", [{label: "Rates", value: 0}, {label: "Credit", value: 0}])',
                'marked = Treemap("Labels with < and &", [{label: "R&D <core>", value: 4200000, heat: 0.012}, {label: "P&L \\"desk\\"", value: 2600000, heat: -0.008}, {label: "<b>bold?</b>", value: 1100000, heat: 0.03}], "currency", 0, "Day change", "percent")',
                'wide = Tabs([t1, t2, t3, t4, t5, t6], ["North America and the Caribbean", "Europe, the Middle East and Africa", "Asia Pacific excluding Japan", "Latin America", "Japan", "Rest of the world"])',
                't1 = Text("Six tabs with long titles. The switcher must reach every one.")',
                't2 = Text("Europe, the Middle East and Africa.")',
                't3 = Text("Asia Pacific excluding Japan.")',
                't4 = Text("Latin America.")',
                't5 = Text("Japan.")',
                `t6 = ${REVENUE_CHART}`
            )
    },
    {
        prompt: 'Replay charts whose names, categories and titles hold &, < and quotes.',
        icon: Icon.code(),
        reply: () =>
            fence(
                'root = Stack([columns, pie, link])',
                'columns = Chart("P&L by desk: R&D & \\"Ops\\"", "column", {categories: ["R&D", "<Ops>", "Sales & \\"Mktg\\"", "A<B"], title: "Desk & <team>"}, {title: "P&L <USD> & \\"net\\"", format: "currency", decimals: 0}, [{name: "P&L", data: [182000, -45000, 231000, 12000]}, {name: "Fees & <costs>", data: [-20000, -8000, -31000, -2000]}])',
                'pie = Chart("Mix", "pie", null, null, [{name: "Weight & <share>", data: [["R&D", 0.42], ["<Ops>", 0.18], ["Sales & \\"Mktg\\"", 0.4]]}])',
                'link = Chart("Names that look like markup", "line", {categories: ["Jan", "Feb", "Mar"]}, null, [{name: "<a href=\\"https://example.com\\">x</a>", data: [1, 3, 2]}, {name: "<img src=x onerror=alert(1)>", data: [2, 1, 3]}])'
            )
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
const REVENUE_CHART =
    'Chart("Monthly revenue", "column", {categories: ["Jan", "Feb", "Mar"]}, {title: "USD", format: "currency", decimals: 0}, [{name: "Revenue", data: [182000, 205000, 231000]}])';

/** Statements as a fenced program, as the format's prompt asks a model to write one. */
function fence(...statements: string[]): string {
    return ['```openui-lang', ...statements, '```'].join('\n');
}
