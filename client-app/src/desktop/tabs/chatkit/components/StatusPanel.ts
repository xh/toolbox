import type {ChatReplyStatus} from '@xh/hoist-chat-kit/core';
import {ChatModel} from '@xh/hoist-chat-kit/core';
import type {ChatStatusCueProps} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {
    chatComposer,
    chatElapsed,
    chatMessageList,
    chatStatusCue,
    chatStatusRegion
} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import type {
    ChatEvent,
    ChatRunRequest,
    ScriptedRequestContext,
    ScriptedResponse
} from '@xh/hoist-chat-kit/transport';
import {
    errorEvents,
    ScriptedChatTransport,
    scriptedDelay,
    textEvents
} from '@xh/hoist-chat-kit/transport';
import {code, div, hbox, span, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {numberInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {action, bindable} from '@xh/hoist/mobx';
import {
    demoFrame,
    demoGrid,
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    fmtDemoConfig
} from '../../../common/Demo';
import {wrapper, wrapperAction, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {chatKitPage} from '../ChatKitCatalog';
import {KIT_LINKS, tabSourceLink} from '../common/ChatDemo';
import './StatusPanel.scss';

const PAGE = chatKitPage('status');

export const statusPanel = hoistCmp.factory({
    displayName: 'ChatKitStatusPanel',
    model: creates(() => StatusPanelModel),

    render({model}) {
        const {status, label, stalledMs, showSpinner, startedAt, endedAt, chatModel, showStopHint} =
            model;
        return wrapper({
            title: PAGE.title,
            icon: PAGE.icon(),
            description: [
                'A reply says what it is doing. Its header shows a status and the time taken so far,',
                'as "Writing 6s" or "Running tools 12s", and after `stallAfterMs` with no data it',
                'says "No response for 34s". The kit draws every status with one icon, one label and',
                'one color, from one table, through `ChatStatusCue`. `ChatElapsed` ticks the time.',
                '',
                'Above the composer, `ChatStatusRegion` shows one line: the most urgent status of',
                'the thread, with at most one action - Try Again, Refresh Status, Cancel or Discard.',
                '`getChatReplyStatus()` in `/core/` reads a message into its status, for a layout of',
                'your own such as a docked header.'
            ],
            links: [
                {
                    url: '$CK/desktop/cmp/chat/README.md#live-cues',
                    text: 'Live cues',
                    notes: 'The spinner, the caret, stalls and the skeleton shimmer.'
                },
                {
                    url: '$CK/desktop/cmp/chat/README.md#recover-from-a-failed-reply',
                    text: 'Recover from a failed reply',
                    notes: 'Every status the region shows, and its action.'
                },
                {
                    url: '$CK/desktop/cmp/chat/README.md#show-a-replys-status',
                    text: "Show a reply's status",
                    notes: '`ChatStatusCue` and `ChatElapsed` in a layout of your own.'
                },
                KIT_LINKS.core,
                tabSourceLink('components/StatusPanel.ts')
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground only - ChatStatusCue',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    info: 'Drives the Playground cue.',
                    items: [
                        wrapperOption({
                            label: 'Status',
                            propName: 'ChatStatusCueProps.status',
                            control: select({
                                bind: 'status',
                                options: STATUSES,
                                enableFilter: false,
                                width: 150
                            })
                        }),
                        wrapperOption({
                            label: 'Label',
                            propName: 'ChatStatusCueProps.label',
                            info: "Words in place of the status's own, such as a tool's verb.",
                            control: textInput({
                                bind: 'label',
                                placeholder: 'Default words',
                                width: 150,
                                commitOnChange: true
                            })
                        }),
                        wrapperOption({
                            label: 'Stalled for',
                            propName: 'ChatStatusCueProps.stalledMs',
                            info: 'Read for the stalled status only.',
                            control: numberInput({
                                bind: 'stalledMs',
                                min: 1000,
                                stepSize: 1000,
                                majorStepSize: 10000,
                                width: 90
                            })
                        }),
                        wrapperOption({
                            label: 'Show spinner',
                            propName: 'ChatStatusCueProps.showSpinner',
                            control: switchInput({bind: 'showSpinner'})
                        })
                    ]
                }),
                wrapperOptionGroup({
                    label: 'Status region',
                    info: 'Drives the chat in the Status region section.',
                    items: [
                        wrapperOption({
                            label: 'Next reply',
                            info: 'How the scripted backend answers the next message.',
                            control: select({
                                bind: 'nextReply',
                                options: NEXT_REPLY_OPTIONS,
                                enableFilter: false,
                                width: 150
                            })
                        }),
                        wrapperOption({
                            label: 'Show "Esc to stop"',
                            propName: 'ChatStatusRegionProps.showStopHint',
                            control: switchInput({bind: 'showStopHint'})
                        }),
                        wrapperOption({
                            label: 'Block sending',
                            propName: 'ChatModelConfig.sendBlocker',
                            control: switchInput({bind: 'blockSending'})
                        })
                    ]
                }),
                wrapperAction({
                    icon: Icon.reset(),
                    text: 'Clear conversation',
                    intent: 'danger',
                    disabled: chatModel.isEmpty,
                    onClick: () => chatModel.clear()
                })
            ],
            item: demoPanel({
                className: 'tb-chatkit-status',
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            caption: 'One status at a time, as a reply header would show it.',
                            showValue: false,
                            config: fmtDemoConfig<ChatStatusCueProps>('chatStatusCue', {
                                status,
                                label: label || undefined,
                                stalledMs: status === 'stalled' ? stalledMs : undefined,
                                showSpinner: showSpinner ? undefined : false
                            }),
                            item: div({
                                className: 'tb-chatkit-status__cue',
                                item: chatStatusCue({
                                    status,
                                    label: label || undefined,
                                    stalledMs,
                                    showSpinner
                                })
                            })
                        })
                    }),
                    demoSection({
                        title: 'Every status',
                        note: 'The idle status renders nothing - a finished reply shows no cue.',
                        item: demoGrid({
                            columns: 4,
                            items: STATUSES.map(it =>
                                demoRow({
                                    key: it,
                                    label: it,
                                    item: div({
                                        className: 'tb-chatkit-status__cue',
                                        item:
                                            it === 'idle'
                                                ? span({
                                                      className: 'tb-chatkit-status__none',
                                                      item: 'Renders nothing'
                                                  })
                                                : chatStatusCue({status: it, stalledMs: 34_000})
                                    })
                                })
                            )
                        })
                    }),
                    demoSection({
                        title: 'ChatElapsed',
                        note: 'Ticks each second from startedAt until endedAt is set.',
                        item: demoFrame({
                            label: 'chatElapsed({startedAt, endedAt})',
                            info: 'Whole seconds from 1s, as 6s or 1m 02s.',
                            item: hbox({
                                className: 'tb-chatkit-status__elapsed',
                                alignItems: 'center',
                                items: [
                                    div({
                                        className: 'tb-chatkit-status__cue',
                                        item: startedAt
                                            ? chatElapsed({startedAt, endedAt})
                                            : span({
                                                  className: 'tb-chatkit-status__none',
                                                  item: 'Not started'
                                              })
                                    }),
                                    button({
                                        text: 'Start',
                                        icon: Icon.play(),
                                        disabled: !!startedAt && !endedAt,
                                        onClick: () => model.startTimer()
                                    }),
                                    button({
                                        text: 'Stop',
                                        icon: Icon.stop(),
                                        disabled: !startedAt || !!endedAt,
                                        onClick: () => model.stopTimer()
                                    }),
                                    button({
                                        text: 'Reset',
                                        icon: Icon.reset(),
                                        disabled: !startedAt,
                                        onClick: () => model.resetTimer()
                                    })
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'Status region',
                        note: 'A custom layout: message list, the region, then the composer. Set the next reply in the rail, then send.',
                        item: demoFrame({
                            label: 'chatStatusRegion()',
                            info: "The thread's next action, in one line above the composer. Stalls show after 6 seconds here.",
                            item: vframe({
                                className: 'tb-chatkit-status__chat',
                                height: 420,
                                items: [
                                    chatMessageList({model: chatModel, assistantName: 'Analyst'}),
                                    chatStatusRegion({
                                        model: chatModel.composerModel,
                                        assistantName: 'Analyst',
                                        showStopHint
                                    }),
                                    chatComposer({
                                        model: chatModel.composerModel,
                                        placeholder: 'Ask for the desk summary...'
                                    })
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'Read a status yourself',
                        note: 'For a header or a dock of your own.',
                        item: demoFrame({
                            info: span(
                                code('getChatReplyStatus({message, lastActivityAt, stallAfterMs})'),
                                ' reads the clock at each call. Nothing observable changes while a reply is quiet, so render again each second to show a stall.'
                            )
                        })
                    })
                ]
            })
        });
    }
});

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
type NextReply = 'ok' | 'fail' | 'failUnsafe' | 'wait' | 'stall';

const STATUSES: ChatReplyStatus[] = [
    'idle',
    'submitted',
    'streaming',
    'recomposing',
    'runningTool',
    'paused',
    'waitingToRetry',
    'detached',
    'stalled',
    'interrupted',
    'cancelledByServer',
    'error',
    'aborted'
];

const NEXT_REPLY_OPTIONS: Array<{value: NextReply; label: string}> = [
    {value: 'ok', label: 'Succeeds'},
    {value: 'fail', label: 'Fails, retry-safe'},
    {value: 'failUnsafe', label: 'Fails, not retry-safe'},
    {value: 'wait', label: 'Asks for a 15s wait'},
    {value: 'stall', label: 'Stalls'}
];

class StatusPanelModel extends HoistModel {
    // Playground - ChatStatusCue
    @bindable accessor status: ChatReplyStatus = 'streaming';
    @bindable accessor label = '';
    @bindable accessor stalledMs = 34_000;
    @bindable accessor showSpinner = true;

    // ChatElapsed
    @bindable accessor startedAt: number = null;
    @bindable accessor endedAt: number = null;

    // Status region
    @bindable accessor nextReply: NextReply = 'ok';
    @bindable accessor blockSending = false;
    @bindable accessor showStopHint = true;

    @managed readonly chatModel = new ChatModel({
        transport: new ScriptedChatTransport({
            delayMs: 20,
            respond: (request, context) => this.respond(request, context)
        }),
        // Short, so a stalled reply shows its status within the demo's patience.
        stallAfterMs: 6_000,
        sendBlocker: () =>
            this.blockSending
                ? 'Pick a desk first. The assistant answers for one desk at a time.'
                : null
    });

    @action
    startTimer() {
        this.startedAt = Date.now();
        this.endedAt = null;
    }

    @action
    stopTimer() {
        this.endedAt = Date.now();
    }

    @action
    resetTimer() {
        this.startedAt = null;
        this.endedAt = null;
    }

    /** The first attempt at a message answers as the rail says. A retry always succeeds. */
    private respond(request: ChatRunRequest, {attempt}: ScriptedRequestContext): ScriptedResponse {
        const mode = attempt === 0 ? this.nextReply : 'ok';
        switch (mode) {
            case 'fail':
                return [
                    scriptedDelay(300),
                    textEvents('Pulling the desk summary now. Technology is'),
                    scriptedDelay(600),
                    errorEvents('The model is overloaded. Please try again.', 'overloaded_error')
                ];
            case 'failUnsafe':
                return [
                    scriptedDelay(300),
                    textEvents('Placing the order with the desk.'),
                    scriptedDelay(600),
                    errorEvents(
                        'The connection dropped while the order was in flight.',
                        'connection_lost',
                        {
                            retrySafe: false
                        }
                    )
                ];
            case 'wait':
                return [
                    scriptedDelay(300),
                    errorEvents(
                        'Too many requests. The model asks for a short wait.',
                        'rate_limited',
                        {
                            retryAfterSeconds: 15
                        }
                    )
                ];
            case 'stall':
                return stalledReply();
            default:
                return [scriptedDelay(400), textEvents(OK_REPLY)];
        }
    }
}

const OK_REPLY =
    'Here is the desk summary. **Technology** is at 112% of its gross limit, **Regional Banks** ' +
    'at 104%, and **Energy** has room at 73%. Nothing else changed since the open.';

/**
 * A reply that starts, then never sends another byte. The transport wraps the iterable so that a
 * stop ends the wait at once.
 */
async function* stalledReply(): AsyncIterable<ChatEvent> {
    yield* textEvents('Let me pull the numbers for every desk');
    await new Promise<never>(() => {});
}
