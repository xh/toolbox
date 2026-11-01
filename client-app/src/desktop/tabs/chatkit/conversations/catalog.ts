import {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import {
    chatUiCardSpec,
    chatUiChartSpec,
    chatUiGridSpec,
    chatUiMetricsSpec
} from '@xh/hoist-chat-kit/desktop/cmp/genui';

/**
 * The generative UI catalog for the Chat Kit demos: the kit's four built-in components, which the
 * model shows by calling `show_metrics`, `show_grid`, `show_chart` and `show_card`.
 */
export function createCatalog(): ChatUiCatalog {
    return new ChatUiCatalog({
        components: [
            chatUiMetricsSpec(),
            chatUiGridSpec({maxRows: 50}),
            chatUiChartSpec(),
            chatUiCardSpec()
        ],
        instructions:
            'The user is a portfolio manager. Lead with a metrics row for headline numbers, use ' +
            'a grid for positions or trades, a chart for performance over time, and a card for ' +
            'the details of a single security.'
    });
}
