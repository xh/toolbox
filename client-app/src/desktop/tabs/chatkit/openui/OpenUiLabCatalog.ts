import {
    chatUiBadgesSpec,
    chatUiCalloutSpec,
    chatUiCardSpec,
    chatUiChartSpec,
    chatUiDividerSpec,
    chatUiGridSpec,
    chatUiInputSpecs,
    chatUiMetricsSpec,
    chatUiSectionSpec,
    chatUiStackSpec,
    chatUiTabsSpec,
    chatUiTextSpec,
    chatUiTreeMapSpec
} from '@xh/hoist-chat-kit/desktop/cmp/genui';
import {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import type {OpenUiToolCall, OpenUiToolSpec} from '@xh/hoist-chat-kit/genui/openui';
import {openUiLangFormat} from '@xh/hoist-chat-kit/genui/openui';

/** What the lab's catalog needs from the chat that uses it. */
export interface OpenUiLabCatalogConfig {
    /**
     * The chat tools that a program may call with `Query()`, with no click by the user. List only
     * tools that read, have no side effects, and need no approval. Default none.
     */
    queryTools?: OpenUiToolSpec[];

    /** Called as each `Query()` call of a program starts, for the inspector's call log. */
    onToolCall?: (call: OpenUiToolCall) => void;
}

/**
 * The catalog of the OpenUI Lab: every component a model may use in an OpenUI Lang program. Each
 * is a Hoist component from the kit - the lab has no OpenUI components of its own.
 *
 * To offer the model a new component, add its spec to `components`. The format derives the
 * component's OpenUI name, its signature and its prompt text from the spec, and the inspector
 * reads the same catalog.
 *
 * The format runs program state: `$variables`, the expressions that read them, `@Set` and
 * `@Reset`, and `Query()` on the tools in `queryTools`. A program cannot change data.
 */
export function createOpenUiLabCatalog({
    queryTools = [],
    onToolCall
}: OpenUiLabCatalogConfig = {}): ChatUiCatalog {
    return new ChatUiCatalog({
        components: [
            // Layout. The stack is the root of every program.
            chatUiStackSpec(),
            chatUiTabsSpec(),
            chatUiSectionSpec(),
            chatUiDividerSpec(),
            // Words and labels.
            chatUiTextSpec(),
            chatUiCalloutSpec(),
            chatUiBadgesSpec(),
            // Values that the model writes into the program.
            chatUiMetricsSpec({maxItems: 6}),
            chatUiGridSpec({maxRows: 50}),
            chatUiChartSpec(),
            chatUiTreeMapSpec(),
            chatUiCardSpec(),
            // Rows that a tool produced, named by artifact id.
            chatUiGridSpec({name: 'dataGrid', byReference: true}),
            chatUiChartSpec({name: 'dataChart', byReference: true}),
            // A form, a button, and an input of each kind. Each input can bind a `$variable`.
            ...chatUiInputSpecs()
        ],
        textFormats: [openUiLangFormat({root: 'stack', bindings: true, queryTools, onToolCall})],
        // With only `openui` here, the chat sends no catalog tools: UI arrives as reply text.
        modes: ['openui'],
        instructions: INSTRUCTIONS
    });
}

//------------------
// Implementation
//------------------
// The generated prompt names two ways to show a tool's data, and does not say when to use which.
// It also tells the model to make up data where no tool fits. These lines settle both.
const INSTRUCTIONS = [
    'The user explores a sample trading portfolio. There are two ways to show its data:',
    '- For a fixed view, call a data tool yourself first. Its result names its rows as an ' +
        'artifact. Show them with DataGrid or DataChart by that id, and write its summary ' +
        'figures into Metrics.',
    '- For a view that the user should change, such as its sector or its sort, bind an input ' +
        'to a $variable and read the data in the program with Query. A Query result has no ' +
        'artifact, so DataGrid and DataChart cannot show it. Read its summary for Metrics and ' +
        'its firstRows for a Grid or a Chart, and set preview to the number of rows you show.',
    'Never make up a figure. If no tool has the data, say so in words.'
].join('\n');
