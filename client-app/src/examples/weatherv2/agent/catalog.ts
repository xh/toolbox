import {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import {
    chatUiCardSpec,
    chatUiChartSpec,
    chatUiGridSpec,
    chatUiMetricsSpec
} from '@xh/hoist-chat-kit/desktop/cmp/genui';

/**
 * The Dashboard Agent's generative UI catalog: the kit's four built-in components, which the model
 * shows by calling `show_metrics`, `show_chart`, `show_grid` and `show_card`. The agent uses them
 * to answer a weather question in the chat, without changing the dashboard.
 */
export function createCatalog(): ChatUiCatalog {
    return new ChatUiCatalog({
        components: [
            chatUiMetricsSpec(),
            chatUiChartSpec({maxSeries: 4, maxPoints: 40}),
            chatUiGridSpec({maxRows: 20}),
            chatUiCardSpec({maxActions: 3})
        ],
        instructions:
            'Use these components only to answer a question about the weather, never to build ' +
            'or change the dashboard. Show current conditions as a metrics row, a forecast as a ' +
            'chart with one point per day, and a comparison of several cities as a grid. Keep ' +
            'answers short: one or two components, and a sentence or two of text.'
    });
}
