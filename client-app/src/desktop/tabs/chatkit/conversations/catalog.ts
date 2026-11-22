import {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import {
    chatUiCardSpec,
    chatUiChartSpec,
    chatUiGridSpec,
    chatUiProgressBarsSpec,
    chatUiPropertyTableSpec,
    chatUiStackSpec,
    chatUiStatCardsSpec,
    chatUiTextSpec
} from '@xh/hoist-chat-kit/desktop/cmp/genui';

/**
 * The generative UI catalog for the Chat Kit demos: the kit's four built-in components, which the
 * model shows by calling `show_stat_cards`, `show_grid`, `show_chart` and `show_card`.
 *
 * @param withDocuments - also offer `show_ui` documents, which lay out several components, with
 *      `stack` and `text` to arrange them, and `progressBars` and `propertyTable`, which only nest.
 */
export function createCatalog({
    withDocuments = false
}: {withDocuments?: boolean} = {}): ChatUiCatalog {
    return new ChatUiCatalog({
        modes: withDocuments ? ['tools', 'document'] : ['tools'],
        components: [
            chatUiStatCardsSpec(),
            chatUiGridSpec({maxRows: 50}),
            chatUiChartSpec(),
            chatUiCardSpec(),
            ...(withDocuments
                ? [
                      chatUiStackSpec(),
                      chatUiTextSpec(),
                      chatUiProgressBarsSpec(),
                      chatUiPropertyTableSpec()
                  ]
                : [])
        ],
        instructions:
            'The user is a portfolio manager. Lead with stat cards for headline numbers, use ' +
            'a grid for positions or trades, a chart for performance over time, and a card for ' +
            'the details of a single security.'
    });
}
