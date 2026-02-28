import {creates, hoistCmp} from '@xh/hoist/core';
import {div, filler, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {textArea} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {sparklesIcon} from '../Icons';
import {ChatHarnessModel} from './ChatHarnessModel';

export const chatHarnessPanel = hoistCmp.factory({
    displayName: 'ChatHarnessPanel',
    model: creates(ChatHarnessModel),

    render({model}) {
        return panel({
            testId: 'chat-panel',
            title: 'LLM Chat',
            icon: sparklesIcon(),
            compactHeader: true,
            item: vbox({flex: 1, items: [messageList(), errorDisplay(), chatInput()]}),
            bbar: toolbar(
                button({
                    testId: 'chat-clear-btn',
                    icon: Icon.delete(),
                    text: 'Clear',
                    onClick: () => model.clearChat()
                }),
                filler()
            )
        });
    }
});

const messageList = hoistCmp.factory<ChatHarnessModel>({
    render({model}) {
        const {messages} = model;

        if (messages.length === 0) {
            return div({
                className: 'weather-v2-chat-empty',
                item: 'Ask the LLM to create or modify your dashboard. Try: "Create a weather dashboard for New York and London side by side."'
            });
        }

        return div({
            className: 'weather-v2-chat-messages',
            items: messages.map((msg, i) =>
                div({
                    key: i,
                    className: `weather-v2-chat-msg weather-v2-chat-msg--${msg.role}`,
                    items: [
                        div({
                            className: 'weather-v2-chat-msg__role',
                            item: msg.role === 'user' ? 'You' : 'Assistant'
                        }),
                        div({
                            className: 'weather-v2-chat-msg__content',
                            item: formatMessageContent(msg.content)
                        })
                    ]
                })
            )
        });
    }
});

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

const chatInput = hoistCmp.factory<ChatHarnessModel>({
    render({model}) {
        const isPending = model.generateTask.isPending;
        return div({
            className: 'weather-v2-chat-input',
            items: [
                textArea({
                    testId: 'chat-input',
                    bind: 'userInput',
                    placeholder: 'Describe what you want...',
                    flex: 1,
                    height: 80,
                    commitOnChange: true
                }),
                button({
                    testId: 'chat-send-btn',
                    icon: isPending ? Icon.spinner() : Icon.chevronRight(),
                    text: isPending ? 'Thinking...' : 'Send',
                    intent: 'primary',
                    disabled: isPending || !model.userInput.trim(),
                    onClick: () => model.sendMessageAsync()
                })
            ]
        });
    }
});

/**
 * Format a message content string, stripping JSON code fences for cleaner display.
 */
function formatMessageContent(content: string): string {
    // Strip the large JSON block from display — user sees the dashboard update instead.
    return content.replace(/```json[\s\S]*?```/g, '[Dashboard spec applied]').trim();
}
