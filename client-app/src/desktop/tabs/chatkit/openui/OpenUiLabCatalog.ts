import {
    chatUiCardSpec,
    chatUiChartSpec,
    chatUiGridSpec,
    chatUiMetricsSpec,
    chatUiStackSpec,
    chatUiTextSpec
} from '@xh/hoist-chat-kit/desktop/cmp/genui';
import {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import type {OpenUiLangFormatOptions} from '@xh/hoist-chat-kit/genui/openui';
import {openUiLangFormat} from '@xh/hoist-chat-kit/genui/openui';

/**
 * Options of the lab's OpenUI Lang format. The inspector builds its own OpenUI library from the
 * same options, so both read a program the same way.
 */
export const OPEN_UI_FORMAT_OPTIONS: OpenUiLangFormatOptions = {root: 'stack'};

/**
 * The catalog of the OpenUI Lab: every component a model may use in an OpenUI Lang program. Each
 * is a Hoist component from the kit - the lab has no OpenUI components of its own.
 *
 * To offer the model a new component, add its spec to `components`. The format derives the
 * component's OpenUI name, its signature and its prompt text from the spec, and the inspector
 * reads the same catalog.
 */
export function createOpenUiLabCatalog(): ChatUiCatalog {
    return new ChatUiCatalog({
        components: [
            // Layout. The stack is the root of every program.
            chatUiStackSpec(),
            chatUiTextSpec(),
            // Values that the model writes into the program.
            chatUiMetricsSpec({maxItems: 6}),
            chatUiGridSpec({maxRows: 50}),
            chatUiChartSpec(),
            chatUiCardSpec(),
            // Rows that a tool produced, named by artifact id.
            chatUiGridSpec({name: 'dataGrid', byReference: true}),
            chatUiChartSpec({name: 'dataChart', byReference: true})
        ],
        textFormats: [openUiLangFormat(OPEN_UI_FORMAT_OPTIONS)],
        // With only `openui` here, the chat sends no catalog tools: UI arrives as reply text.
        modes: ['openui'],
        instructions:
            'The user explores a sample trading portfolio. Get real figures from a data tool ' +
            'before you show any. A tool result names its rows as an artifact: show them with ' +
            'DataGrid or DataChart by that id. Write values into a program yourself only for a ' +
            'few figures, such as the totals of a tool result in Metrics.'
    });
}
