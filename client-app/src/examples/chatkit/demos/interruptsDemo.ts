import {
    interruptEvents,
    ScriptedChatTransport,
    scriptedDelay,
    textEvents,
    toolCallEvents
} from '@xh/hoist-chat-kit/transport';
import type {ChatEvent, ChatRunRequest, ScriptedRequestContext} from '@xh/hoist-chat-kit/transport';
import {Icon} from '@xh/hoist/icon';
import type {ChatKitDemo} from './Types';

/**
 * A server agent that asks before it acts, through AG-UI interrupts. Its run ends with questions,
 * or with a request to run one of its own tools, and the chat answers them in the next run. Each
 * suggestion shows one shape: a lone choice, several questions with a form, and an approval.
 */
export const interruptsDemo: ChatKitDemo = {
    id: 'interrupts',
    title: 'Agent Questions',
    description: "A server agent's questions and approvals",
    icon: Icon.questionCircle(),
    heading: 'Let the agent ask you',
    intro:
        'A server agent pauses its run to ask you something, then carries on with your answer. ' +
        'Pick a choice, fill in a short form, or allow one of its tools to run.',
    suggestions: [
        {text: 'Send me the weekly risk report'},
        {text: 'Book a room for the desk offsite'},
        {text: 'Move $5,000 to the hedging account'}
    ],
    createChatConfig: () => ({
        transport: new ScriptedChatTransport({delayMs: 15, respond: createResponse})
    })
};

//------------------
// Implementation
//------------------
function createResponse(request: ChatRunRequest, {userMessage}: ScriptedRequestContext) {
    const text = userMessage?.text.toLowerCase() ?? '';
    if (request.resume) return afterAnswers(request);
    if (text.includes('room')) return askAboutRoom();
    if (text.includes('$') || text.includes('move')) return askToTransfer();
    return askFormat();
}

function askFormat() {
    return [
        scriptedDelay(400),
        textEvents('I can set that up.'),
        interruptEvents([
            {
                id: 'format',
                reason: 'input_required',
                message: 'How would you like the report?',
                responseSchema: {
                    type: 'object',
                    properties: {
                        format: {
                            oneOf: [
                                {const: 'pdf', title: 'PDF', description: 'One page per desk'},
                                {const: 'excel', title: 'Excel', description: 'Every position'},
                                {const: 'email', title: 'Email summary', description: 'Totals only'}
                            ]
                        }
                    },
                    required: ['format']
                }
            }
        ])
    ];
}

function askAboutRoom() {
    return [
        scriptedDelay(400),
        textEvents('Happy to book it. Two things first.'),
        interruptEvents([
            {
                id: 'size',
                reason: 'input_required',
                message: 'How big a room?',
                responseSchema: {type: 'string', enum: ['Huddle', 'Team', 'Boardroom']}
            },
            {
                id: 'details',
                reason: 'input_required',
                message: 'When, and for how many?',
                responseSchema: {
                    type: 'object',
                    properties: {
                        date: {type: 'string', format: 'date', title: 'Date'},
                        attendees: {
                            type: 'integer',
                            title: 'Attendees',
                            minimum: 2,
                            maximum: 40,
                            default: 8
                        },
                        catering: {type: 'boolean', title: 'Catering'},
                        note: {type: 'string', title: 'Note for facilities'}
                    },
                    required: ['date', 'attendees']
                }
            }
        ])
    ];
}

function askToTransfer() {
    return [
        scriptedDelay(400),
        textEvents('I will move the funds once you allow it.'),
        toolCallEvents(
            'transfer_funds',
            {amount: 5000, from: 'Operating', to: 'Hedging'},
            {toolCallId: 'transfer-1'}
        ),
        interruptEvents([
            {
                id: 'approve-transfer',
                reason: 'tool_call',
                toolCallId: 'transfer-1',
                message: 'Move $5,000 from Operating to Hedging?'
            }
        ])
    ];
}

function afterAnswers({resume}: ChatRunRequest) {
    // The agent runs its own tool once allowed, and reports the result.
    const transfer = resume.find(it => it.interruptId === 'approve-transfer'),
        isAllowed = (transfer?.payload as {approved?: boolean})?.approved === true,
        result: ChatEvent[] = transfer
            ? [
                  {
                      type: 'TOOL_CALL_RESULT',
                      toolCallId: 'transfer-1',
                      messageId: 'transfer-1-result',
                      content: JSON.stringify(isAllowed ? {status: 'SETTLED'} : {status: 'NOT_RUN'})
                  }
              ]
            : [],
        lines = resume.map(it =>
            it.status === 'cancelled'
                ? `- **${it.interruptId}**: declined`
                : `- **${it.interruptId}**: \`${JSON.stringify(it.payload)}\``
        );
    return [
        scriptedDelay(300),
        result,
        textEvents(`Thanks. The agent received:\n\n${lines.join('\n')}`)
    ];
}
