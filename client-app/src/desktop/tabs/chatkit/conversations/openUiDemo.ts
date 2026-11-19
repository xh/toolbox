import type {ChatToolSpec} from '@xh/hoist-chat-kit/core';
import {
    chatUiCardSpec,
    chatUiChartSpec,
    chatUiGridSpec,
    chatUiInputSpecs,
    chatUiSectionSpec,
    chatUiStackSpec,
    chatUiStatCardsSpec,
    chatUiTextSpec
} from '@xh/hoist-chat-kit/desktop/cmp/genui';
import {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import {openUiLangFormat} from '@xh/hoist-chat-kit/genui/openui';
import {ScriptedChatTransport, scriptedDelay, textEvents} from '@xh/hoist-chat-kit/transport';
import type {ScriptedRequestContext} from '@xh/hoist-chat-kit/transport';
import type {ChatDemoSpec} from '../common/ChatDemo';
import {chatDemoPanel, KIT_LINKS} from '../common/ChatDemo';

/**
 * OpenUI Lang: the model writes a small program in its reply, which the kit runs as live UI -
 * inputs bound to `$variables`, a query that re-runs as they change, buttons that set state, and
 * a form that sends its values back.
 */
const DEMO: ChatDemoSpec = {
    pageId: 'openUi',
    description: [
        'The model replies with an **OpenUI Lang program** in an `openui` fence, which the kit',
        'parses as it streams and runs as Hoist components.',
        '',
        'The first reply binds a select to `$region`, and a `Query()` reads `get_sales` through',
        "the chat's own client tool, again each time the region changes. Buttons run `@Set`,",
        '`@Reset` and `@Run`, and a section starts collapsed. The second reply is a form whose',
        'Submit sends its values back with `@ToAssistant`.'
    ],
    kitApi: ['openUiLangFormat', 'queryTools', 'ChatUiCatalog', 'chatUiInputSpecs'],
    links: [KIT_LINKS.genui, KIT_LINKS.protocols],
    heading: 'Ask for live UI',
    intro: 'The model writes a program: a region picker over a sales query, a counter and a form.',
    suggestions: [{text: 'Show me sales by region'}, {text: 'Show the details form'}],
    createChatConfig: () => ({
        transport: new ScriptedChatTransport({delayMs: 14, respond: createResponse}),
        catalog: createCatalog(),
        tools: [salesTool]
    })
};

export const openUiPanel = chatDemoPanel(DEMO);

//------------------
// Implementation
//------------------
let salesCalls = 0;

const salesTool: ChatToolSpec & {returns: object} = {
    name: 'get_sales',
    description: "Total sales for a region, as of today. Reads the app's data only.",
    parameters: {type: 'object', properties: {region: {enum: ['emea', 'apac']}}},
    returns: {
        type: 'object',
        properties: {total: {type: 'number'}, calls: {type: 'integer'}}
    },
    // `calls` counts the runs, so the page shows when a query runs again.
    execute: ({region}) => ({
        total: region === 'apac' ? 4_215_000 : 7_850_000,
        calls: ++salesCalls
    })
};

const SALES_PROGRAM = [
    'root = Stack([region, total, runs, refresh, counter, inc, reset, detail])',
    '$region = "emea"',
    'region = Select("region", ["emea", "apac"], "Region", null, null, null, $region)',
    'sales = Query("get_sales", {region: $region}, {total: 0, calls: 0})',
    'total = StatCards([{label: "Sales", value: sales.total, format: "currency"}])',
    'runs = Text("Query runs: " + sales.calls)',
    'refresh = Button("Refresh", @Run(sales))',
    '$count = 0',
    'counter = Text("Count: " + $count)',
    'inc = Button("Add", @Set($count, $count + 1))',
    'reset = Button("Reset", @Reset($count))',
    'detail = Section([note], "By desk", null, true, true)',
    'note = Text("Collapsed until opened")'
].join('\n');

const FORM_PROGRAM = [
    'root = Stack([region, note, form])',
    '$region = "emea"',
    'region = Select("region", [{value: "emea", label: "EMEA"}, {value: "apac", label: "APAC"}], "Region", null, null, null, $region)',
    'note = Text("Showing " + ($region == "apac" ? "Asia Pacific" : "Europe"))',
    'form = Form([name, submit], "Details")',
    'name = TextInput("name", "Name", null, {required: true}, $name)',
    'submit = Button("Submit", @ToAssistant("Use these details", {name: $name, region: $region}), "primary")'
].join('\n');

function createCatalog(): ChatUiCatalog {
    return new ChatUiCatalog({
        modes: ['tools', 'openui'],
        components: [
            chatUiStatCardsSpec(),
            chatUiGridSpec({maxRows: 50}),
            chatUiChartSpec(),
            chatUiCardSpec(),
            chatUiStackSpec(),
            chatUiTextSpec(),
            chatUiSectionSpec(),
            ...chatUiInputSpecs()
        ],
        textFormats: [openUiLangFormat({root: 'stack', queryTools: [salesTool]})]
    });
}

function createResponse(_, {userMessage}: ScriptedRequestContext) {
    const text = userMessage?.text ?? '';
    if (/use these details/i.test(text)) {
        const {name, region} = (userMessage.metadata?.context ?? {}) as Record<string, string>;
        return [scriptedDelay(300), textEvents(`Thanks, ${name}. I'll use ${region}.`)];
    }
    const program = /form|details/i.test(text) ? FORM_PROGRAM : SALES_PROGRAM;
    return [scriptedDelay(300), textEvents(`Here it is:\n\n\`\`\`openui\n${program}\n\`\`\``)];
}
