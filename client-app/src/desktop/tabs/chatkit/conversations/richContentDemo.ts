import {
    citationEvents,
    ScriptedChatTransport,
    scriptedDelay,
    sourceEvents,
    textEvents
} from '@xh/hoist-chat-kit/transport';
import type {ChatDemoSpec} from '../common/ChatDemo';
import {chatDemoPanel, KIT_LINKS} from '../common/ChatDemo';
import {markdown} from '../common/scriptUtils';

/**
 * A long markdown answer: headings, lists, a table, code in two languages, a blockquote, and
 * citations that link to the sources listed under the reply.
 */
const DEMO: ChatDemoSpec = {
    pageId: 'richContent',
    description: [
        'The reply streams as markdown through `chatMarkdown`, which renders half-written syntax',
        'cleanly as the text arrives and memoizes each finished block. Headings, lists, a table,',
        'TypeScript and Groovy code blocks and a blockquote all come from one `textEvents` script.',
        '',
        'Citations arrive as the text does, as numbered markers at the end of the paragraph they',
        'support, and the sources list under the reply shares their numbers. Hover a marker for',
        "the source's card, or click it to open the source."
    ],
    kitApi: ['ScriptedChatTransport', 'textEvents', 'citationEvents', 'sourceEvents'],
    links: [KIT_LINKS.markdown, KIT_LINKS.desktop, KIT_LINKS.transport],
    heading: 'Ask for a reply with tables and code',
    intro:
        'The reply streams as markdown - headings, lists, a table, TypeScript and Groovy code ' +
        'blocks and a blockquote - with numbered citations and the sources they point to.',
    suggestions: [
        {text: 'How do I add a chat to my Hoist app?'},
        {text: 'Which transport should I use?'}
    ],
    createChatConfig: () => ({
        transport: new ScriptedChatTransport({
            delayMs: 12,
            respond: () => [scriptedDelay(600), createReply()]
        })
    })
};

export const richContentPanel = chatDemoPanel(DEMO);

//------------------
// Implementation
//------------------
const SOURCES = [
    {
        id: 'src-kit',
        title: 'Hoist Chat Kit - core README',
        url: 'https://github.com/xh/hoist-chat-kit',
        snippet: 'Platform-neutral chat models: conversation state, the turn loop and tools.'
    },
    {
        id: 'src-core',
        title: 'hoist-core - BaseController',
        url: 'https://github.com/xh/hoist-core',
        snippet: 'Base class for Hoist server controllers, with JSON rendering and streaming.'
    },
    {
        id: 'src-agui',
        title: 'AG-UI Protocol',
        url: 'https://docs.ag-ui.com',
        snippet: 'An open, event-based protocol for connecting agents to user interfaces.'
    }
];

const cite = (...sourceIds: string[]) =>
    citationEvents(
        sourceIds.map(sourceId => {
            const {title, url} = SOURCES.find(it => it.id === sourceId);
            return {sourceId, title, url};
        })
    );

const INTRO = markdown(`
    ## Adding a chat to a Hoist app

    A chat needs two things: a **\`ChatModel\`** on the client, which holds the conversation and
    runs each turn, and a **transport** that connects it to the model. The kit streams every reply
    token by token, so the user sees the answer as it is written.
`);

const CLIENT = markdown(`
    ### 1. Create the model

    Give the \`ChatModel\` a transport and any tools the model may call. Tools with an \`execute\`
    function run in the browser, so the model can act on the app:

    \`\`\`typescript
    const chatModel = new ChatModel({
        transport: new HoistChatTransport({
            url: 'llm/stream',
            codec: new AnthropicCodec({system: 'You are a helpful analyst.'})
        }),
        tools: [
            {
                name: 'open_position',
                description: 'Open the detail view for a position.',
                parameters: {type: 'object', properties: {symbol: {type: 'string'}}},
                execute: ({symbol}) => XH.appModel.openPosition(symbol)
            }
        ]
    });
    \`\`\`

    ### 2. Relay the model on the server

    The server holds the API key, and relays the provider's stream to the browser one event per
    line, flushing each as it arrives:

    \`\`\`groovy
    class LlmController extends BaseController {

        def llmService

        def stream() {
            response.contentType = 'application/x-ndjson'
            def out = response.outputStream
            llmService.stream(parseRequestJSON(), authUsername) { String event ->
                out.write((event + '\\n').getBytes(UTF_8))
                out.flush()
                return true
            }
        }
    }
    \`\`\`
`);

const TRANSPORTS = markdown(`
    ### Choosing a transport

    | Transport | Backend | Use it for |
    |-----------|---------|------------|
    | \`HoistChatTransport\` | A hoist-core endpoint | Most apps - the key stays on the server |
    | \`SseChatTransport\` | An AG-UI agent server | Agents built with LangGraph, Mastra and others |
    | \`ScriptedChatTransport\` | None | Demos and unit tests, like this one |

    A few things to keep in mind:

    - Each transport yields the same events, so the UI never changes.
    - Keep the system prompt on the server when it holds anything sensitive.
    - Tools declared on the client are sent to the model with every request.

    > **Tip:** start with \`ScriptedChatTransport\` while you design the UI. Swap in the real
    > transport once the conversation flows the way you want.
`);

// Built per reply, as each call generates new message ids.
const createReply = () => [
    textEvents(INTRO),
    cite('src-kit'),
    textEvents(CLIENT, {chunkSize: 8}),
    cite('src-kit', 'src-core'),
    textEvents(TRANSPORTS),
    cite('src-agui'),
    sourceEvents(SOURCES)
];
