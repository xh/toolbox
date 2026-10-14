import type {ChatToolCallPart, ChatToolSpec} from '@xh/hoist-chat-kit/core';
import {
    ScriptedChatTransport,
    scriptedDelay,
    textEvents,
    toolCallEvents
} from '@xh/hoist-chat-kit/transport';
import type {ChatRunRequest, ScriptedRequestContext} from '@xh/hoist-chat-kit/transport';
import {div, span} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import type {HoistProps, PlainObject} from '@xh/hoist/core';
import {fmtNumber, fmtPrice} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {wait} from '@xh/hoist/promise';
import {capitalize, last, lowerCase} from 'lodash';
import type {ReactNode} from 'react';
import type {ChatKitDemo} from './Types';

/**
 * A tool that needs the user's approval before it runs. The turn pauses on the call until the
 * user approves or denies it, and the reply follows their choice. The tool's renderer shows the
 * order as a ticket, so the user reviews the order itself rather than the call's raw input.
 */
export const approvalDemo: ChatKitDemo = {
    id: 'approval',
    title: 'Approval',
    description: 'A tool call waits for Approve or Deny',
    icon: Icon.shieldCheck(),
    heading: 'Ask for an order to approve',
    intro:
        'The model wants to place an order, which needs your approval. The turn pauses on the ' +
        'call until you approve or deny it, and the reply follows your choice.',
    suggestions: [
        {text: 'Buy 500 shares of MSFT at market'},
        {text: 'Trim my NVDA position by 2,000 shares'}
    ],
    createChatConfig: () => ({
        transport: new ScriptedChatTransport({delayMs: 15, respond: createResponse}),
        tools: [SUBMIT_ORDER]
    })
};

//------------------
// Implementation
//------------------
const SUBMIT_ORDER: ChatToolSpec = {
    name: 'submit_order',
    displayName: 'Submit order',
    description: 'Send an order to the trading desk.',
    icon: Icon.transaction(),
    summary: ({input}) => (isOrder(input) ? formatOrder(input) : null),
    needsApproval: true,
    approvalPrompt: ({side, quantity, symbol, type}) =>
        `${capitalize(side)} ${fmtShares(quantity)} ${symbol} at ${lowerCase(type ?? 'market')}?`,
    renderer: part => orderTicket({part}),
    execute: async ({symbol, side, quantity}) => {
        await wait(800);
        return {
            orderId: 'ORD-48213',
            status: 'FILLED',
            symbol,
            side,
            quantity,
            avgPrice: symbol === 'NVDA' ? 118.42 : 412.37
        };
    }
};

interface OrderTicketProps extends HoistProps {
    part: ChatToolCallPart;
}

/** The order in a call to `submit_order`, and its fill once the order has run. */
const orderTicket = hoistCmp.factory<OrderTicketProps>({
    displayName: 'OrderTicket',
    className: 'tb-order-ticket',

    render({className, part}) {
        const {input, output, state} = part;
        if (!isOrder(input)) return null;

        const {side, quantity, symbol, type, account} = input,
            isFilled = state === 'output-available';
        return div({
            className,
            items: [
                div({
                    className: 'tb-order-ticket__headline',
                    items: [
                        span({
                            className: `tb-order-ticket__side tb-order-ticket__side--${side.toLowerCase()}`,
                            item: side
                        }),
                        span(`${fmtShares(quantity)} ${symbol}`)
                    ]
                }),
                ticketField('Order type', capitalize(type ?? 'market')),
                ticketField('Account', account),
                isFilled ? ticketField('Status', `Filled - ${output.orderId}`) : null,
                isFilled
                    ? ticketField('Average price', fmtPrice(output.avgPrice, {prefix: '$'}))
                    : null,
                isFilled
                    ? ticketField(
                          'Value',
                          fmtNumber(output.avgPrice * output.quantity, {precision: 0, prefix: '$'})
                      )
                    : null
            ]
        });
    }
});

function ticketField(label: string, value: ReactNode) {
    return div({
        className: 'tb-order-ticket__field',
        items: [span({className: 'tb-order-ticket__label', item: label}), span(value)]
    });
}

function isOrder(input: PlainObject): boolean {
    return !!(input?.symbol && input.side && input.quantity);
}

/** An order as the desk writes it, e.g. "SELL 2,000 NVDA". */
function formatOrder({side, quantity, symbol}: PlainObject): string {
    return `${side} ${fmtShares(quantity)} ${symbol}`;
}

function fmtShares(quantity: number): string {
    return fmtNumber(quantity, {precision: 0, asHtml: true}) as string;
}

function createResponse(request: ChatRunRequest, {stepIndex, userMessage}: ScriptedRequestContext) {
    if (stepIndex === 0) {
        const order = /nvda/i.test(userMessage?.text)
            ? {symbol: 'NVDA', side: 'SELL', quantity: 2000}
            : {symbol: 'MSFT', side: 'BUY', quantity: 500};
        return [
            scriptedDelay(500),
            textEvents(
                `I'll send a market order to ${order.side.toLowerCase()} ` +
                    `**${order.quantity.toLocaleString()} ${order.symbol}**. Orders need your ` +
                    'approval, so please review it below.'
            ),
            toolCallEvents('submit_order', {...order, type: 'MARKET', account: 'TECH-01'})
        ];
    }

    // The last message is the reply the turn is building, with the call from the first step.
    const call = last(request.messages).toolCalls.find(it => it.toolName === 'submit_order');
    if (call?.state === 'output-available') {
        const {orderId, symbol, quantity, avgPrice} = call.output;
        return [
            scriptedDelay(400),
            textEvents(
                `Done - order **${orderId}** filled: ${quantity.toLocaleString()} ${symbol} at ` +
                    `an average of $${avgPrice}. The Tech book shows the new position.`
            )
        ];
    }
    return [
        scriptedDelay(400),
        textEvents(
            "Understood - I didn't place the order. Let me know if you'd like to change the " +
                'size, set a limit price, or route it to a different account.'
        )
    ];
}
