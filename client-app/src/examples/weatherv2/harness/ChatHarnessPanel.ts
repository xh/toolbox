import {creates, hoistCmp} from '@xh/hoist/core';
import {div, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {textArea} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {sparklesIcon} from '../Icons';
import {ChatHarnessModel, DisplayMessage, formatMessageContent} from './ChatHarnessModel';

export const chatHarnessPanel = hoistCmp.factory({
    displayName: 'ChatHarnessPanel',
    model: creates(ChatHarnessModel),

    render({model}) {
        return panel({
            testId: 'chat-panel',
            title: 'Dashboard Agent',
            icon: sparklesIcon(),
            compactHeader: true,
            headerItems: [
                button({
                    testId: 'chat-clear-btn',
                    icon: Icon.reset(),
                    tooltip: 'Clear conversation',
                    onClick: () => model.clearChat()
                })
            ],
            item: vbox({flex: 1, items: [messageList(), errorDisplay(), chatInput()]})
        });
    }
});

//--------------------------------------------------
// Message List
//--------------------------------------------------
const messageList = hoistCmp.factory<ChatHarnessModel>({
    render({model}) {
        const {displayMessages} = model;

        if (displayMessages.length === 0) {
            return emptyState();
        }

        return div({
            className: 'weather-v2-chat-messages',
            items: displayMessages.map((msg, i) => renderBubble(model, msg, i)),
            ref: (el: HTMLElement) => {
                if (el) el.scrollTop = el.scrollHeight;
            }
        });
    }
});

/** Render a single chat bubble — thinking placeholder, user, or assistant. */
function renderBubble(model: ChatHarnessModel, msg: DisplayMessage, index: number) {
    if (msg.thinking) {
        return div({
            key: `thinking-${index}`,
            className:
                'weather-v2-chat-msg weather-v2-chat-msg--assistant weather-v2-chat-msg--thinking',
            items: [
                div({className: 'weather-v2-chat-msg__role', item: 'Assistant'}),
                div({
                    className: 'weather-v2-chat-msg__content',
                    item: div({
                        className: 'weather-v2-thinking-dots',
                        items: [
                            div({className: 'weather-v2-thinking-dot'}),
                            div({className: 'weather-v2-thinking-dot'}),
                            div({className: 'weather-v2-thinking-dot'})
                        ]
                    })
                })
            ]
        });
    }

    const formatted = formatMessageContent(msg.content);
    const displayed = model.getDisplayContent(index, formatted);
    const isTyping = index === model.typingMessageIdx;

    return div({
        key: index,
        className: `weather-v2-chat-msg weather-v2-chat-msg--${msg.role}`,
        items: [
            div({
                className: 'weather-v2-chat-msg__role',
                item: msg.role === 'user' ? 'You' : 'Assistant'
            }),
            div({
                className: `weather-v2-chat-msg__content${isTyping ? ' weather-v2-chat-msg__content--typing' : ''}`,
                item: displayed
            })
        ]
    });
}

//--------------------------------------------------
// Empty State with Suggestions
//--------------------------------------------------
const SUGGESTIONS = [
    'Compare weather in New York and Tokyo side by side',
    'Show current conditions for 16 major cities in a 4x4 grid',
    'Build a compact 3-city overview dashboard',
    'Simplify to just current conditions and the 5-day forecast',
    'Add a markdown welcome banner at the top of the dashboard'
];

const emptyState = hoistCmp.factory<ChatHarnessModel>({
    render({model}) {
        return div({
            className: 'weather-v2-chat-empty',
            items: [
                div({
                    className: 'weather-v2-chat-empty__intro',
                    items: [
                        sparklesIcon({size: '2x'}),
                        div({
                            className: 'weather-v2-chat-empty__text',
                            item: 'Tell the agent what to build and it will create or update your dashboard.'
                        })
                    ]
                }),
                div({
                    className: 'weather-v2-chat-empty__suggestions',
                    items: [
                        div({
                            className: 'weather-v2-chat-empty__suggestions-label',
                            item: 'Try asking:'
                        }),
                        ...SUGGESTIONS.map(suggestion =>
                            div({
                                className: 'weather-v2-chat-suggestion',
                                item: suggestion,
                                onClick: () => model.sendMessageAsync(suggestion)
                            })
                        )
                    ]
                })
            ]
        });
    }
});

//--------------------------------------------------
// Error Display
//--------------------------------------------------
const errorDisplay = hoistCmp.factory<ChatHarnessModel>({
    render({model}) {
        const {lastError} = model;
        if (!lastError) return null;

        return div({
            className: 'weather-v2-validation weather-v2-validation--error',
            item: lastError
        });
    }
});

//--------------------------------------------------
// Chat Input
//--------------------------------------------------
const chatInput = hoistCmp.factory<ChatHarnessModel>({
    render({model}) {
        const isPending = model.generateTask.isPending;
        return div({
            className: 'weather-v2-chat-input',
            items: [
                textArea({
                    testId: 'chat-input',
                    bind: 'userInput',
                    placeholder: 'Tell the agent what to build...',
                    flex: 1,
                    height: 80,
                    commitOnChange: true,
                    disabled: isPending,
                    onKeyDown: (e: KeyboardEvent) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            model.sendMessageAsync();
                        }
                    }
                }),
                button({
                    testId: 'chat-send-btn',
                    icon: Icon.chevronRight(),
                    text: 'Send',
                    intent: 'primary',
                    disabled: isPending || !model.userInput.trim(),
                    onClick: () => model.sendMessageAsync()
                })
            ]
        });
    }
});
