import {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import {
    chatUiCardSpec,
    chatUiChartSpec,
    chatUiGridSpec,
    chatUiProgressBarsSpec,
    chatUiPropertyTableSpec,
    chatUiStackSpec,
    chatUiStatCardsSpec
} from '@xh/hoist-chat-kit/desktop/cmp/genui';

/**
 * The generative UI catalog for the Chat Kit demos. The model shows the kit's stat cards, grid,
 * chart and card by calling `show_stat_cards`, `show_grid`, `show_chart` and `show_card`. Progress
 * bars and a property table have no tool of their own: the model nests them in a `show_ui`
 * document, under a stack.
 */
export function createCatalog(): ChatUiCatalog {
    return new ChatUiCatalog({
        components: [
            chatUiStatCardsSpec(),
            chatUiGridSpec({maxRows: 50}),
            chatUiChartSpec(),
            chatUiCardSpec(),
            chatUiStackSpec(),
            chatUiProgressBarsSpec(),
            chatUiPropertyTableSpec()
        ],
        modes: ['tools', 'document'],
        instructions:
            'The user is a portfolio manager. Lead with a row of stat cards for headline numbers, use ' +
            'a grid for positions or trades, a chart for performance over time, and a card for ' +
            'the details of a single security. Show weights or usage against a limit as progress ' +
            'bars, and facts that need no card as a property table, each in a show_ui document.'
    });
}
