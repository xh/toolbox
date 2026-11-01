import type {ChatModelConfig, ChatToolSpec} from '@xh/hoist-chat-kit/core';
import {ChatModel} from '@xh/hoist-chat-kit/core';
import type {ChatPanelProps} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {
    chatClearButton,
    chatComposer,
    chatMessageList,
    chatPanel,
    chatStatusRegion
} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {
    ScriptedChatTransport,
    scriptedDelay,
    sourceEvents,
    textEvents,
    toolCallEvents
} from '@xh/hoist-chat-kit/transport';
import {div, filler, hframe, placeholder, span, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {segmentedControl, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import classNames from 'classnames';
import {
    demoFrame,
    demoPanel,
    demoPlayground,
    demoSection,
    fmtDemoConfig,
    raw
} from '../../../common/Demo';
import {wrapper, wrapperAction, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {chatKitPage} from '../ChatKitCatalog';
import {KIT_LINKS, tabSourceLink} from '../common/ChatDemo';
import {createSampleConversation} from '../common/sampleConversation';
import {markdown} from '../common/scriptUtils';
import {arrayLiteral, rawObject, snippet} from '../common/snippetUtils';
import './ChatPanelPanel.scss';

/**
 * The flagship component page: a `ChatPanel` driven by the rail, then the kit's resizable side
 * panel pattern and a custom layout of the pieces behind the panel.
 */
export const chatPanelPanel = hoistCmp.factory({
    displayName: 'ChatPanelPanel',
    model: creates(() => ChatPanelPanelModel),

    render({model}) {
        const page = chatKitPage('chatPanel'),
            {chatModel} = model;

        return wrapper({
            title: page.title,
            icon: page.icon(),
            description: [
                '`ChatPanel` renders a complete chat in one Hoist `Panel`: the message list, the',
                "status region with the thread's next action, and the composer. Give it a",
                '`ChatModel` and any `Panel` props for the chrome around it.',
                '',
                'The nested components take their props through `messageListProps`,',
                '`composerProps`, `statusRegionProps` and `emptyStateProps`, so one config sets up',
                'the whole chat.',
                '',
                'The reply here is scripted. It calls one tool the browser runs, then answers with a',
                'table and two cited sources. Send any message to see it.'
            ],
            links: [
                KIT_LINKS.desktop,
                KIT_LINKS.core,
                tabSourceLink('components/ChatPanelPanel.ts'),
                {
                    url: '$CK/desktop/cmp/chat/ChatPanel.ts',
                    notes: 'Kit component, with the full doc comments.'
                }
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground only - props',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    info: 'Drives the Playground chat. The other sections use their own models.',
                    items: [
                        wrapperOption({
                            label: 'Title',
                            propName: 'ChatPanelProps.title',
                            control: textInput({bind: 'title', width: 140, commitOnChange: true})
                        }),
                        wrapperOption({
                            label: 'Compact header',
                            propName: 'ChatPanelProps.compactHeader',
                            control: switchInput({bind: 'compactHeader'})
                        }),
                        wrapperOption({
                            label: 'Assistant name',
                            propName: 'ChatMessageListProps.assistantName',
                            control: textInput({
                                bind: 'assistantName',
                                width: 140,
                                commitOnChange: true
                            })
                        }),
                        wrapperOption({
                            label: 'Message headers',
                            propName: 'ChatMessageListProps.showMessageHeader',
                            control: switchInput({bind: 'showMessageHeader'})
                        }),
                        wrapperOption({
                            label: 'Empty title',
                            propName: 'ChatPanelProps.emptyStateProps.title',
                            control: textInput({
                                bind: 'emptyTitle',
                                width: 140,
                                commitOnChange: true
                            })
                        }),
                        wrapperOption({
                            label: 'Empty text',
                            propName: 'ChatPanelProps.emptyStateProps.text',
                            control: textInput({
                                bind: 'emptyText',
                                width: 140,
                                commitOnChange: true
                            })
                        }),
                        wrapperOption({
                            label: 'Suggestions',
                            propName: 'ChatPanelProps.suggestions',
                            control: switchInput({bind: 'showSuggestions'})
                        }),
                        wrapperOption({
                            label: 'Placeholder',
                            propName: 'ChatComposerProps.placeholder',
                            control: textInput({
                                bind: 'placeholder',
                                width: 140,
                                commitOnChange: true
                            })
                        }),
                        wrapperOption({
                            label: 'Composer layout',
                            propName: 'ChatComposerProps.layout',
                            control: segmentedControl({
                                bind: 'composerLayout',
                                fill: false,
                                compact: true,
                                options: ['stacked', 'inline']
                            })
                        }),
                        wrapperOption({
                            label: 'Stop hint',
                            propName: 'ChatStatusRegionProps.showStopHint',
                            info: 'The "Esc to stop" in the busy line above the composer.',
                            control: switchInput({bind: 'showStopHint'})
                        }),
                        wrapperOption({
                            label: 'Citation markers',
                            propName: 'ChatPanelProps.citationMarkers',
                            info: 'Renders the reply\'s inline "[1]" as buttons for its sources.',
                            control: switchInput({bind: 'citationMarkers'})
                        }),
                        wrapperOption({
                            label: 'Compact density',
                            info: 'Adds `xh-chat--compact` to the panel, for a narrow host.',
                            control: switchInput({bind: 'compact'})
                        }),
                        wrapperOption({
                            label: 'Reduced motion',
                            info: 'Adds `xh-chat--reduced-motion`, for the static twin of each cue.',
                            control: switchInput({bind: 'reducedMotion'})
                        })
                    ]
                }),
                wrapperAction({
                    icon: Icon.comment(),
                    text: 'Load sample conversation',
                    disabled: chatModel.isBusy,
                    onClick: () => chatModel.loadMessages(createSampleConversation())
                }),
                wrapperAction({
                    icon: Icon.reset(),
                    text: 'Clear conversation',
                    intent: 'danger',
                    disabled: model.allEmpty,
                    onClick: () => model.clearAll()
                })
            ],
            item: demoPanel({
                className: 'tb-chatkit-chat-panel',
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 560,
                            caption:
                                'Send a message, or load the sample conversation, to see the message list options.',
                            config: model.configSnippet,
                            value: {
                                status: chatModel.status,
                                isBusy: chatModel.isBusy,
                                messages: chatModel.messages.length
                            },
                            item: div({
                                className: 'tb-chatkit-chat-panel__instance',
                                item: chatPanel({
                                    model: chatModel,
                                    ...model.playgroundProps,
                                    flex: 1
                                })
                            })
                        })
                    }),
                    demoSection({
                        title: 'In a resizable side panel',
                        note: 'A Hoist panel with a PanelModel holds the chat. Drag its edge, or collapse it.',
                        item: demoFrame({
                            label: 'Side panel',
                            info: "panel({modelConfig: {side: 'right', defaultSize: 420, minSize: 320}}), at compact density",
                            item: hframe({
                                className: 'tb-chatkit-chat-panel__side-host',
                                items: [
                                    placeholder(
                                        Icon.window(),
                                        'App content - a grid, a chart or a form.'
                                    ),
                                    panel({
                                        modelConfig: {
                                            side: 'right',
                                            defaultSize: 420,
                                            minSize: 320
                                        },
                                        className: 'xh-chat--compact',
                                        item: chatPanel({
                                            model: model.sideChatModel,
                                            flex: 1,
                                            title: 'Assistant',
                                            icon: Icon.ai(),
                                            compactHeader: true,
                                            headerItems: [
                                                chatClearButton({chatModel: model.sideChatModel})
                                            ],
                                            suggestions: SUGGESTIONS,
                                            citationMarkers: true
                                        })
                                    })
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'Custom layout',
                        note: 'chatMessageList, chatStatusRegion and chatComposer, composed directly.',
                        item: demoFrame({
                            label: 'Custom layout',
                            info: 'vframe of the pieces behind ChatPanel, under a toolbar of its own',
                            item: vframe({
                                className: 'tb-chatkit-chat-panel__custom',
                                items: [
                                    toolbar({
                                        compact: true,
                                        items: [
                                            Icon.ai(),
                                            span('Research desk'),
                                            filler(),
                                            chatClearButton({chatModel: model.customChatModel})
                                        ]
                                    }),
                                    chatMessageList({
                                        model: model.customChatModel,
                                        assistantName: 'Analyst',
                                        citationMarkers: true,
                                        suggestions: SUGGESTIONS
                                    }),
                                    div({
                                        className: 'tb-chatkit-chat-panel__custom-footer',
                                        items: [
                                            chatStatusRegion({
                                                model: model.customChatModel.composerModel,
                                                assistantName: 'Analyst'
                                            }),
                                            chatComposer({
                                                model: model.customChatModel.composerModel,
                                                layout: 'inline',
                                                placeholder: 'Ask the research desk...'
                                            })
                                        ]
                                    })
                                ]
                            })
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
class ChatPanelPanelModel extends HoistModel {
    @managed chatModel = new ChatModel(createChatConfig());
    @managed sideChatModel = new ChatModel(
        createChatConfig({initialMessages: createSampleConversation()})
    );
    @managed customChatModel = new ChatModel(
        createChatConfig({initialMessages: createSampleConversation()})
    );

    // Playground props
    @bindable accessor title = 'Assistant';
    @bindable accessor compactHeader = true;
    @bindable accessor assistantName = 'Analyst';
    @bindable accessor showMessageHeader = true;
    @bindable accessor emptyTitle = 'What should we look at?';
    @bindable accessor emptyText = 'Ask about positions, P&L or risk. The replies are scripted.';
    @bindable accessor showSuggestions = true;
    @bindable accessor placeholder = 'Ask about your portfolio...';
    @bindable accessor composerLayout: 'stacked' | 'inline' = 'stacked';
    @bindable accessor showStopHint = true;
    @bindable accessor citationMarkers = true;
    @bindable accessor compact = false;
    @bindable accessor reducedMotion = false;

    get allEmpty(): boolean {
        return this.chatModels.every(it => it.isEmpty);
    }

    clearAll() {
        this.chatModels.forEach(it => it.clear());
    }

    /** Props for the Playground chat, from the rail. */
    get playgroundProps(): ChatPanelProps {
        const {chatModel} = this;
        return {
            title: this.title,
            icon: Icon.ai(),
            compactHeader: this.compactHeader,
            headerItems: [chatClearButton({chatModel})],
            className: this.densityClasses,
            citationMarkers: this.citationMarkers,
            emptyStateProps: {title: this.emptyTitle, text: this.emptyText},
            suggestions: this.showSuggestions ? SUGGESTIONS : null,
            composerProps: {placeholder: this.placeholder, layout: this.composerLayout},
            messageListProps: {
                assistantName: this.assistantName,
                showMessageHeader: this.showMessageHeader
            },
            statusRegionProps: {showStopHint: this.showStopHint}
        };
    }

    /** The snippet for the Playground chat, with only the props that differ from the default. */
    get configSnippet(): string {
        return fmtDemoConfig<ChatPanelProps>('chatPanel', {
            model: raw('chatModel'),
            title: this.title || undefined,
            icon: raw('Icon.ai()'),
            compactHeader: this.compactHeader || undefined,
            headerItems: raw('[chatClearButton({chatModel})]'),
            className: this.densityClasses || undefined,
            citationMarkers: this.citationMarkers || undefined,
            emptyStateProps: rawObject({
                title: this.emptyTitle || undefined,
                text: this.emptyText || undefined
            }),
            suggestions: this.showSuggestions ? snippet(arrayLiteral(SUGGESTIONS)) : undefined,
            composerProps: rawObject({
                placeholder: this.placeholder || undefined,
                layout: this.composerLayout === 'inline' ? 'inline' : undefined
            }),
            messageListProps: rawObject({
                assistantName: this.assistantName || undefined,
                showMessageHeader: this.showMessageHeader ? undefined : false
            }),
            statusRegionProps: this.showStopHint ? undefined : raw('{showStopHint: false}')
        });
    }

    private get densityClasses(): string {
        return classNames(
            this.compact && 'xh-chat--compact',
            this.reducedMotion && 'xh-chat--reduced-motion'
        );
    }

    private get chatModels(): ChatModel[] {
        return [this.chatModel, this.sideChatModel, this.customChatModel];
    }
}

//------------------------------------------------------------------
// Script
//------------------------------------------------------------------
const SUGGESTIONS = ['Why is the Rates book down today?', 'Summarize my P&L by book'];

function createChatConfig(config: Partial<ChatModelConfig> = {}): ChatModelConfig {
    return {
        transport: new ScriptedChatTransport({
            delayMs: 15,
            respond: (request, {stepIndex}) =>
                stepIndex === 0 ? createToolStep() : createAnswerStep()
        }),
        tools: TOOLS,
        composer: {drafts: 'memory'},
        ...config
    };
}

const TOOLS: ChatToolSpec[] = [
    {
        name: 'get_book_pnl',
        displayName: 'Get book P&L',
        description: "A book's P&L for the day, by position.",
        icon: Icon.portfolio(),
        summary: part => part.input?.book,
        execute: async () => {
            await wait(1100);
            return {
                book: 'Rates',
                dayPnl: -412_000,
                positions: [
                    {symbol: 'UST 10Y', dayPnl: -301_000},
                    {symbol: 'UST 2Y', dayPnl: -142_000},
                    {symbol: 'Bund 10Y', dayPnl: 31_000}
                ]
            };
        }
    }
];

function createToolStep() {
    return [
        scriptedDelay(400),
        textEvents("I'll pull today's P&L for the Rates book."),
        toolCallEvents('get_book_pnl', {book: 'Rates'})
    ];
}

const ANSWER = markdown(`
    The Rates book is down **$412k** today. Most of the loss is in the long end of the
    Treasury curve, after a hot inflation print pushed yields higher [1]:

    | Position | Day P&L |
    |----------|--------:|
    | UST 10Y | -$301k |
    | UST 2Y | -$142k |
    | Bund 10Y | +$31k |

    The Bund position offset a little of the move, as European yields rose less [2]. The book
    is still inside its daily loss limit.
`);

function createAnswerStep() {
    return [
        scriptedDelay(300),
        sourceEvents([
            {
                marker: 1,
                url: 'https://www.bls.gov/cpi/',
                title: 'Consumer Price Index - latest release',
                snippet: 'Core CPI rose 0.4% in the month, above the 0.3% consensus.'
            },
            {
                marker: 2,
                url: 'https://www.ecb.europa.eu/stats/financial_markets_and_interest_rates/',
                title: 'Euro area yield curves',
                snippet: 'Ten-year euro area yields rose 4 basis points on the day.'
            }
        ]),
        textEvents(ANSWER)
    ];
}
