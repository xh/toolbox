import type {ChatToolSpec} from '@xh/hoist-chat-kit/core';
import {
    reasoningEvents,
    ScriptedChatTransport,
    scriptedDelay,
    textEvents,
    toolCallEvents
} from '@xh/hoist-chat-kit/transport';
import {wait} from '@xh/hoist/promise';
import {Icon} from '@xh/hoist/icon';
import {markdown} from './scriptUtils';
import type {ChatKitDemo} from './Types';

/**
 * Streamed reasoning, then three tool calls the browser runs in turn - one of which fails - and an
 * answer that works with the results it has.
 */
export const reasoningDemo: ChatKitDemo = {
    id: 'reasoning',
    title: 'Reasoning and tools',
    description: 'Thinking, then three tool calls - one fails',
    icon: Icon.gears(),
    heading: 'Watch the model think, then call tools',
    intro:
        'The model thinks out loud, then calls three tools at once. Two return data and one ' +
        'times out. Expand the reasoning or any tool card to see its input and output.',
    suggestions: [
        {text: 'Why is the Tech book down today?'},
        {text: 'Check my portfolio before the close'}
    ],
    createChatConfig: () => ({
        transport: new ScriptedChatTransport({
            delayMs: 15,
            respond: (request, {stepIndex}) =>
                stepIndex === 0 ? createToolStep() : createAnswerStep()
        }),
        tools: TOOLS
    })
};

//------------------
// Implementation
//------------------
const TOOLS: ChatToolSpec[] = [
    {
        name: 'get_positions',
        displayName: 'Get positions',
        description: 'Positions in a book, with P&L for the day.',
        icon: Icon.portfolio(),
        summary: part => part.input?.book,
        execute: async () => {
            await wait(900);
            return {
                book: 'Tech',
                positions: [
                    {symbol: 'NVDA', qty: 12000, dayPnl: -184200},
                    {symbol: 'MSFT', qty: 8500, dayPnl: -41300},
                    {symbol: 'AAPL', qty: 15000, dayPnl: 22800}
                ]
            };
        }
    },
    {
        name: 'get_market_data',
        displayName: 'Get market data',
        description: 'Latest prices and moves for a list of symbols.',
        icon: Icon.chartLine(),
        summary: part => part.input?.symbols?.join(', '),
        execute: async () => {
            await wait(1200);
            return {
                NVDA: {last: 118.42, change: -0.061},
                MSFT: {last: 412.1, change: -0.012},
                AAPL: {last: 231.6, change: 0.007},
                SOX: {last: 4920.5, change: -0.038}
            };
        }
    },
    {
        name: 'get_risk_limits',
        displayName: 'Get risk limits',
        description: 'Risk limits and current usage for a book.',
        icon: Icon.shieldHalved(),
        summary: part => part.input?.book,
        execute: async () => {
            await wait(1600);
            throw new Error('Risk service timed out after 1.5s.');
        }
    }
];

const REASONING = markdown(`
    The user wants to know why the Tech book is down. I should look at three things:

    1. **Positions** - which names drive the day's P&L.
    2. **Market data** - whether the move is stock-specific or sector-wide. The SOX index will tell me.
    3. **Risk limits** - whether the loss puts the book near a limit.

    These calls are independent, so I can make all three at once.
`);

function createToolStep() {
    return [
        scriptedDelay(400),
        reasoningEvents(REASONING),
        textEvents("I'll pull positions, market data and risk limits for the Tech book."),
        toolCallEvents('get_positions', {book: 'Tech'}),
        toolCallEvents('get_market_data', {symbols: ['NVDA', 'MSFT', 'AAPL', 'SOX']}),
        toolCallEvents('get_risk_limits', {book: 'Tech'})
    ];
}

const ANSWER = markdown(`
    The Tech book is down about **$203k** today, and almost all of it is **NVDA**:

    - **NVDA** fell 6.1%, for a loss of $184k on 12,000 shares.
    - **MSFT** lost $41k on a 1.2% dip.
    - **AAPL** gained $23k and offset some of the loss.

    The move is mostly sector-wide: the SOX semiconductor index is down 3.8%, so NVDA is falling
    with its peers, only harder.

    I couldn't check risk limits - the risk service timed out. Ask me again in a minute, or check
    the limits screen before you add to the position.
`);

function createAnswerStep() {
    return [scriptedDelay(500), textEvents(ANSWER)];
}
