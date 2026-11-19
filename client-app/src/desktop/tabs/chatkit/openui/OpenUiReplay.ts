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
        prompt: 'Replay an interactive filter: inputs bound to $variables, with no model call.',
        icon: Icon.filter(),
        reply: () =>
            [
                'Change an input. The text, the metrics and the chart follow, and no message is sent.',
                '',
                fence(
                    'root = Stack([controls, flags, note, kpis, trend])',
                    '$region = "emea"',
                    '$net = false',
                    'controls = Stack([pick, segments], "row")',
                    'pick = Select("region", [{value: "emea", label: "EMEA"}, {value: "apac", label: "APAC"}, {value: "amer", label: "Americas"}], "Region, as a select", null, null, null, $region)',
                    'segments = SegmentedControl("regionSegments", [{value: "emea", label: "EMEA"}, {value: "apac", label: "APAC"}, {value: "amer", label: "Americas"}], "Region, as segments", null, $region)',
                    'flags = Stack([net, netBox], "row")',
                    'net = Switch("net", "Net of costs, as a switch", $net)',
                    'netBox = Checkbox("netBox", "Net of costs, as a checkbox", $net)',
                    'note = Text("Showing **" + ($region == "apac" ? "Asia Pacific" : ($region == "amer" ? "the Americas" : "Europe, the Middle East and Africa")) + "**, " + ($net ? "net of costs." : "gross."))',
                    'kpis = Metrics([{label: "Revenue", value: ($region == "apac" ? 103000 : ($region == "amer" ? 310000 : 205000)) - ($net ? 40000 : 0), format: "currency", decimals: 0}, {label: "Basis", value: $net ? "Net" : "Gross"}])',
                    'trend = Chart("Monthly revenue: " + $region, "column", {categories: ["Jan", "Feb", "Mar"]}, {title: "USD", format: "currency", decimals: 0}, [{name: $net ? "Net revenue" : "Revenue", data: $region == "apac" ? [30000, 35000, 38000] : ($region == "amer" ? [95000, 104000, 111000] : [61000, 70000, 74000])}])'
                )
            ].join('\n')
    },
    {
        prompt: 'Replay a live query: a select and segments feed a Query, which fills a grid and a chart.',
        icon: Icon.database(),
        reply: () =>
            [
                'The program reads the positions itself. Change the sector or the sort, and the query runs again. Each call shows under Calls in the inspector.',
                '',
                fence(
                    'root = Stack([controls, totals, table, bars, refresh])',
                    '$sector = "Technology"',
                    '$sort = "pnl"',
                    'positions = Query("query_positions", {groupBy: ["region"], filter: {sector: $sector}, sortBy: $sort, preview: 10}, {summary: {pnl: 0, mktVal: 0, positions: 0}, firstRows: []})',
                    'controls = Stack([pickSector, pickSort], "row")',
                    'pickSector = Select("sector", ["All", "Technology", "Energy", "Financials", "Healthcare", "Utilities"], "Sector", null, null, null, $sector)',
                    'pickSort = SegmentedControl("sort", [{value: "pnl", label: "P&L"}, {value: "mktVal", label: "Market value"}, {value: "positions", label: "Positions"}], "Sort by", null, $sort)',
                    'totals = Metrics([{label: "P&L", value: positions.summary.pnl, format: "currency", decimals: 0}, {label: "Market value", value: positions.summary.mktVal, format: "currency", decimals: 0}, {label: "Positions", value: positions.summary.positions}])',
                    'table = Grid($sector + " by region", [{field: "region"}, {field: "pnl", headerName: "P&L", type: "number", format: "currency", decimals: 0}, {field: "mktVal", headerName: "Mkt Value", type: "number", format: "currency", decimals: 0}, {field: "positions", type: "number"}], null, positions.firstRows)',
                    'bars = Chart("P&L by region", "bar", {categories: positions.firstRows.region}, {format: "currency", decimals: 0}, [{name: "P&L", data: positions.firstRows.pnl}])',
                    'refresh = Button("Run the query again", @Run(positions))'
                )
            ].join('\n')
    },
    {
        prompt: 'Replay the query limits: five programs in one reply, one of them with nine queries.',
        icon: Icon.stopwatch(),
        reply: () =>
            [
                'Only the first three programs of a reply run queries, and a program with more than eight runs none. The Calls tab shows which calls started.',
                '',
                queryProgram('sector'),
                '',
                fence(
                    'root = Stack([lead])',
                    ...['sector', 'region', 'fund', 'model', 'trader', 'symbol'].map(
                        (dim, idx) =>
                            `q${idx + 1} = Query("query_positions", {groupBy: ["${dim}"], limit: ${idx + 1}}, {summary: {positions: 0}})`
                    ),
                    'q7 = Query("query_trades", {limit: 7}, {summary: {trades: 0}})',
                    'q8 = Query("query_trades", {limit: 8}, {summary: {trades: 0}})',
                    'q9 = Query("query_trades", {limit: 9}, {summary: {trades: 0}})',
                    'lead = Metrics([{label: "Program 2: nine queries", value: q1.summary.positions + q2.summary.positions + q3.summary.positions + q4.summary.positions + q5.summary.positions + q6.summary.positions + q7.summary.trades + q8.summary.trades + q9.summary.trades}])'
                ),
                '',
                queryProgram('region'),
                '',
                queryProgram('fund'),
                '',
                queryProgram('trader')
            ].join('\n')
    },
    {
        prompt: 'Replay a form with every input and its rules, sent with a button.',
        icon: Icon.edit(),
        reply: () =>
            [
                'Fill the form in. The button checks every field, then sends the values as a message.',
                '',
                fence(
                    'root = Stack([form])',
                    'form = Form([client, note, quantity, side, tags, settle, flags, send], "New order ticket")',
                    'client = TextInput("client", "Client", "Client name", {required: true, minLength: 3, maxLength: 30})',
                    'note = TextArea("note", "Note", "Anything the desk should know?", {maxLength: 60})',
                    'quantity = NumberInput("quantity", "Quantity", "1 to 1,000", {required: true, min: 1, max: 1000})',
                    'side = Select("side", [{value: "buy", label: "Buy"}, {value: "sell", label: "Sell"}], "Side", "Pick a side", null, {required: true})',
                    'tags = Select("tags", ["Urgent", "Hedged", "Block", "Algo"], "Tags", "Any tags", true)',
                    'settle = DateInput("settle", "Settle date", {required: true, min: "2026-11-01", max: "2026-12-31"})',
                    'flags = Stack([confirmed, live], "row")',
                    'confirmed = Checkbox("confirmed", "Client confirmed")',
                    'live = Switch("live", "Use live prices", true)',
                    'send = Button("Send ticket", @ToAssistant("Book this order ticket."), "primary")'
                )
            ].join('\n')
    },
    {
        prompt: 'Replay buttons and actions: set, reset, a multi-step action, and actions that cannot run.',
        icon: Icon.bolt(),
        reply: () =>
            fence(
                'root = Stack([status, steps, finish, refused])',
                '$step = 1',
                '$name = "draft"',
                'saved = Mutation("save_region", {name: $name})',
                'status = Callout("primary", "State", "Step **" + $step + "** of 3. Name: **" + $name + "**.")',
                'steps = Stack([next, back, reset], "row")',
                'next = Button("Next step", @Set($step, $step + 1), "primary")',
                'back = Button("Back", @Set($step, $step - 1))',
                'reset = Button("Reset", @Reset($step, $name))',
                'finish = Stack([rename, done], "row")',
                'rename = TextInput("name", "Name", null, null, $name)',
                'done = Button("Finish and send", Action([@Set($step, 3), @ToAssistant("Finished at step " + $step, {step: $step, name: $name})]), "success")',
                'refused = Stack([save, site, twice], "row")',
                'save = Button("Save, by a mutation", @Run(saved), "danger")',
                'site = Button("Open a site", @OpenUrl("https://xh.io"))',
                'twice = Button("Send two messages", Action([@ToAssistant("One"), @ToAssistant("Two")]))'
            )
    },
    {
        prompt: 'Replay form controls in a row, in a section and in tabs.',
        icon: Icon.layout(),
        reply: () =>
            fence(
                'root = Stack([inRow, inSection, inTabs])',
                'inRow = Stack([rowText, rowNumber, rowSelect, rowButton], "row")',
                'rowText = TextInput("rowText", "Text", "In a row")',
                'rowNumber = NumberInput("rowNumber", "Number", null, {min: 0, max: 10})',
                'rowSelect = Select("rowSelect", ["One", "Two", "Three"], "Select")',
                'rowButton = Button("Go", @ToAssistant("Go"))',
                'inSection = Section([sectionForm], "Inputs in a section", null, true)',
                'sectionForm = Form([sectionDate, sectionMulti, sectionPeriod, sectionSubmit], "A form in a section")',
                'sectionDate = DateInput("sectionDate", "Date", {required: true})',
                'sectionMulti = Select("sectionMulti", ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"], "Multi select", "Pick any", true)',
                'sectionPeriod = SegmentedControl("sectionPeriod", ["Day", "Week", "Month"], "Period", null, "Week")',
                'sectionSubmit = Button("Submit", @ToAssistant("Submit the section form."), "primary")',
                'inTabs = Tabs([tabOne, tabTwo], ["Inputs", "More inputs"])',
                'tabOne = Stack([tabNote, tabAgree])',
                'tabNote = TextArea("tabNote", "Note", "A short note")',
                'tabAgree = Checkbox("tabAgree", "Agree")',
                'tabTwo = Stack([tabLive, tabDate, tabSelect])',
                'tabLive = Switch("tabLive", "Live")',
                'tabDate = DateInput("tabDate", "Another date")',
                'tabSelect = Select("tabSelect", ["Red", "Green", "Blue", "Cyan", "Magenta", "Yellow", "Black", "White"], "A select at the bottom of the reply")'
            )
    },
    {
        prompt: 'Replay programs that the safety gate refuses, beside one that runs.',
        icon: Icon.shieldCheck(),
        reply: () =>
            [
                'The kit measures each program before it reads it. The first three programs below break a rule, and each shows one message that says why. The last one runs.',
                '',
                '**Statements that refer to each other in a circle:**',
                '',
                fence(
                    'root = Stack([first])',
                    'first = Stack([second])',
                    'second = Stack([first])'
                ),
                '',
                '**An `@Each` whose variable is not in quotes:**',
                '',
                fence(
                    'root = Stack([list])',
                    'desks = [{name: "Rates", pnl: 4200000}, {name: "Credit", pnl: -2600000}]',
                    'list = Stack(@Each(desks, desk, Text(desk.name)))'
                ),
                '',
                '**A chain that doubles with each line, past the size budget:**',
                '',
                fence(
                    'root = Stack([level1, level1])',
                    ...Array.from(
                        {length: 17},
                        (_, idx) => `level${idx + 1} = Stack([level${idx + 2}, level${idx + 2}])`
                    ),
                    'level18 = Text("One of 262,144 copies.")'
                ),
                '',
                '**The same `@Each`, with its variable in quotes:**',
                '',
                fence(
                    'root = Stack([cards])',
                    'desks = [{name: "Rates", pnl: 4200000}, {name: "Credit", pnl: -2600000}, {name: "FX", pnl: 1100000}]',
                    'cards = Stack(@Each(desks, "desk", Card(desk.name, "Desk", [{label: "P&L", value: desk.pnl, format: "currency", decimals: 0}])), "row")'
                )
            ].join('\n')
    },
    {
        prompt: 'Replay slips a model can make: some the format corrects, some it reports.',
        icon: Icon.warning(),
        reply: () =>
            [
                'Each slip below shows in the inspector.',
                '',
                fence(
                    'root = Stack([lead, row, gauge, margin, card])',
                    'lead = Text("Five slips: a named argument, an unknown component, a bad value, one action where a list goes, and an unused statement.")',
                    // Named arguments: the format reports the element, as its arguments would shift.
                    'row = Stack([one, two], direction: "row")',
                    'one = Text("One")',
                    'two = Text("Two")',
                    // A component that the catalog lacks.
                    'gauge = Gauge("Load", 0.7)',
                    // A value outside the schema of a prop: the parser drops it.
                    'margin = Metrics([{label: "Margin", value: 0.184, format: "ratio"}])',
                    // One action where the prop takes a list: read as a list of one.
                    'card = Card("Acme Corp", null, [{label: "Exposure", value: 4200000, format: "currency", decimals: 0}], @ToAssistant("Tell me more about Acme Corp."))',
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

/** A small program with one query, which totals the positions by the given dimension. */
function queryProgram(dim: string): string {
    return fence(
        'root = Stack([total])',
        `q = Query("query_positions", {groupBy: ["${dim}"]}, {summary: {groups: 0, positions: 0}})`,
        `total = Metrics([{label: "Groups by ${dim}", value: q.summary.groups}, {label: "Positions", value: q.summary.positions}])`
    );
}

/** Statements as a fenced program, as the format's prompt asks a model to write one. */
function fence(...statements: string[]): string {
    return ['```openui-lang', ...statements, '```'].join('\n');
}
