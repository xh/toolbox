import {createElement} from 'react';
import {creates, hoistCmp} from '@xh/hoist/core';
import {div, hbox, vbox} from '@xh/hoist/cmp/layout';
import {markdown} from '@xh/hoist/cmp/markdown';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {jsonInput, textArea} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {sparklesIcon} from '../Icons';
import {
    ChatHarnessModel,
    DisplayMessage,
    ToolCallDisplay,
    formatMessageContent
} from './ChatHarnessModel';

export const chatHarnessPanel = hoistCmp.factory({
    displayName: 'ChatHarnessPanel',
    model: creates(ChatHarnessModel),

    render({model}) {
        return panel({
            testId: 'chat-panel',
            title: 'Dashboard Agent',
            icon: sparklesIcon(),
            compactHeader: true,
            flex: 1,
            minHeight: 0,
            headerItems: [
                button({
                    testId: 'chat-clear-btn',
                    icon: Icon.reset(),
                    tooltip: 'Clear conversation',
                    onClick: () => model.clearChat()
                })
            ],
            item: vbox({
                className: 'weather-v2-chat-body',
                flex: 1,
                items: [messageList(), errorDisplay(), chatInput()]
            })
        });
    }
});

//--------------------------------------------------
// Message List
//--------------------------------------------------
const messageList = hoistCmp.factory<ChatHarnessModel>({
    render({model}) {
        const {displayMessages, generateTask} = model;

        // Append a thinking placeholder when waiting for an LLM response
        const msgs = [...displayMessages];
        if (
            generateTask.isPending &&
            (msgs.length === 0 || msgs[msgs.length - 1].role === 'user')
        ) {
            msgs.push({role: 'assistant', content: '', thinking: true});
        }

        if (msgs.length === 0) {
            return emptyState();
        }

        return div({
            className: 'weather-v2-chat-messages',
            items: msgs.map((msg, i) => renderBubble(model, msg, i)),
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
    const isAssistant = msg.role === 'assistant';

    // Render completed assistant messages as markdown; use plain text during
    // typewriter animation (partial markdown would produce broken rendering)
    // and for user messages.
    const contentItem =
        isAssistant && !isTyping
            ? div({
                  className: 'weather-v2-chat-markdown',
                  item: markdown({content: displayed, lineBreaks: false})
              })
            : displayed;

    return div({
        key: index,
        className: `weather-v2-chat-msg weather-v2-chat-msg--${msg.role}`,
        items: [
            div({
                className: 'weather-v2-chat-msg__role',
                items: [
                    msg.role === 'user' ? 'You' : 'Assistant',
                    msg.elapsedMs
                        ? div({
                              className: 'weather-v2-chat-msg__elapsed',
                              item: formatElapsed(msg.elapsedMs)
                          })
                        : null
                ]
            }),
            // Tool calls rendered between role label and text content
            ...(msg.toolCalls?.length ? [renderToolCalls(msg.toolCalls)] : []),
            div({
                className: `weather-v2-chat-msg__content${isTyping ? ' weather-v2-chat-msg__content--typing' : ''}`,
                item: contentItem
            })
        ]
    });
}

/** Render tool call summary cards (collapsed by default using native details/summary). */
function renderToolCalls(toolCalls: ToolCallDisplay[]) {
    return div({
        className: 'weather-v2-tool-calls',
        items: toolCalls.map((tc, i) =>
            createElement(
                'details',
                {key: `tool-${i}`, className: 'weather-v2-tool-call'},
                createElement(
                    'summary',
                    {className: 'weather-v2-tool-call__summary'},
                    Icon.tools(),
                    friendlyToolSummary(tc)
                ),
                div({
                    className: 'weather-v2-tool-call__detail',
                    items: [
                        renderToolPayload('Input', tc.input),
                        renderToolPayload('Result', tc.result, tc.isError)
                    ]
                })
            )
        )
    });
}

/**
 * Render a tool call payload (input or result). Small values render inline;
 * large JSON payloads render in a readonly jsonInput with search and copy.
 */
function renderToolPayload(label: string, value: any, isError?: boolean): any {
    if (value == null) return null;

    const isObject = typeof value === 'object';
    const str = isObject ? JSON.stringify(value, null, 2) : String(value);

    // Empty objects don't need display
    if (isObject && Object.keys(value).length === 0) return null;

    // Only large JSON objects get the jsonInput treatment
    if (isObject && str.length >= 120) {
        return div({
            className: isError ? 'weather-v2-tool-call__error' : null,
            items: [
                div({item: `${label}:`}),
                jsonInput({
                    value: str,
                    readonly: true,
                    showCopyButton: true,
                    showFullscreenButton: true,
                    editorProps: {lineNumbers: false},
                    width: '100%',
                    minHeight: 240
                })
            ]
        });
    }

    // Everything else renders inline
    return div({
        className: isError ? 'weather-v2-tool-call__error' : null,
        item: `${label}: ${isObject ? JSON.stringify(value) : str}`
    });
}

/** Format elapsed milliseconds into a friendly human-readable string. */
function formatElapsed(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const secs = ms / 1000;
    if (secs < 60) return `${secs.toFixed(1)}s`;
    const mins = Math.floor(secs / 60);
    const remainSecs = Math.round(secs % 60);
    return `${mins}m ${remainSecs}s`;
}

/** Map tool name + input to a human-readable summary. */
function friendlyToolSummary(tc: ToolCallDisplay): string {
    switch (tc.name) {
        // Dashboard tools
        case 'set_dashboard':
            return 'set_dashboard';
        case 'add_widget':
            return `add_widget: ${tc.input?.viewSpecId ?? ''}`;
        case 'remove_widget':
            return `remove_widget: ${tc.input?.instanceId ?? ''}`;
        case 'update_widget':
            return `update_widget: ${tc.input?.instanceId ?? ''}`;
        case 'move_widget':
            return `move_widget: ${tc.input?.instanceId ?? ''}`;
        case 'list_widgets':
            return 'list_widgets';
        // App operation tools
        case 'save_dashboard_as_view':
            return `save_view: ${tc.input?.name ?? ''}`;
        case 'switch_to_view':
            return `switch_to_view: ${tc.input?.name ?? ''}`;
        case 'reset_dashboard':
            return 'reset_dashboard';
        case 'toggle_theme':
            return 'toggle_theme';
        case 'open_widget_chooser':
            return 'open_widget_chooser';
        case 'show_json_spec':
            return 'show_json_spec';
        case 'toggle_manual_editing':
            return 'toggle_manual_editing';
        default:
            return tc.name;
    }
}

//--------------------------------------------------
// Empty State with Suggestions
//--------------------------------------------------
const SUGGESTIONS = [
    'Compare weather in New York and Tokyo side by side',
    'Show current conditions for 16 major cities in a 4x4 grid',
    'Set up a Tokyo weather dashboard and save it as a view called "Tokyo Overview"',
    'Simplify to just current conditions and the 5-day forecast'
];

const META_SUGGESTIONS = [
    'What can you help me do?',
    'How do I change which city my dashboard shows?'
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
                }),
                div({
                    className: 'weather-v2-chat-empty__suggestions',
                    items: [
                        div({
                            className: 'weather-v2-chat-empty__suggestions-label',
                            item: 'Or ask about the agent:'
                        }),
                        ...META_SUGGESTIONS.map(suggestion =>
                            div({
                                className:
                                    'weather-v2-chat-suggestion weather-v2-chat-suggestion--meta',
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
            className: 'weather-v2-chat-error',
            items: [
                div({className: 'weather-v2-chat-error__message', item: lastError}),
                hbox({
                    className: 'weather-v2-chat-error__actions',
                    items: [
                        button({
                            icon: Icon.refresh(),
                            text: 'Retry',
                            intent: 'danger',
                            outlined: true,
                            onClick: () => model.retryLastAsync()
                        }),
                        button({
                            icon: Icon.edit(),
                            text: 'Edit',
                            outlined: true,
                            onClick: () => model.editLast()
                        })
                    ]
                })
            ]
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
