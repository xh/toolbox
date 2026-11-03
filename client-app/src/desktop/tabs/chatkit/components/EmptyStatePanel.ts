import type {ChatComposerHost, ChatModelConfig, ChatSendSpec} from '@xh/hoist-chat-kit/core';
import {ChatComposerModel, ChatModel} from '@xh/hoist-chat-kit/core';
import type {ChatPanelProps, ChatSuggestion} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {
    chatClearButton,
    chatComposer,
    chatEmptyState,
    chatPanel,
    chatSuggestions
} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {ScriptedChatTransport, scriptedDelay, textEvents} from '@xh/hoist-chat-kit/transport';
import {div, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {numberInput, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import type {ReactNode} from 'react';
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
import {arrayLiteral, objectLiteral, rawObject, snippet} from '../common/ChatDemoUtils';
import './EmptyStatePanel.scss';

/**
 * The welcome screen of a new chat: a Playground over `emptyStateProps` and `suggestions`, then
 * the empty state and suggestions on their own, and an empty state of the page's own.
 */
export const emptyStatePanel = hoistCmp.factory({
    displayName: 'EmptyStatePanel',
    model: creates(() => EmptyStatePanelModel),

    render({model}) {
        const page = chatKitPage('emptyState'),
            {chatModel} = model;

        return wrapper({
            title: page.title,
            icon: page.icon(),
            description: [
                'A `ChatPanel` with no messages shows its empty state: a heading and supporting',
                'text, the composer centered at about 40% of the height, then suggestion cards.',
                'The first send moves the composer to the bottom in one frame, and focus stays in',
                'it.',
                '',
                'Set the heading, text and icon with `emptyStateProps`. Its `header`,',
                '`belowComposer` and `footer` take content of your own, with no kit styles.',
                '',
                'A click on a suggestion fills the composer and focuses it. It never sends. The',
                'cards hide while the composer has text.',
                '',
                'The empty state **settles** once as it mounts: the heading, the text, the',
                'composer, then everything below it fade in and rise 8px in sequence. It plays',
                'again on New Chat, never on a re-render, and gives way to reduced motion. Click',
                '**Replay settle** to see it again.'
            ],
            links: [
                KIT_LINKS.desktop,
                tabSourceLink('components/EmptyStatePanel.ts'),
                {
                    url: '$CK/desktop/cmp/chat/ChatEmptyState.ts',
                    notes: 'Kit component, with the full doc comments.'
                },
                {
                    url: '$CK/desktop/cmp/chat/ChatSuggestions.ts',
                    notes: 'The suggestion cards.'
                }
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground only - props',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    info: 'Drives the Playground chat. The other sections set their own props.',
                    items: [
                        wrapperOption({
                            label: 'Title',
                            propName: 'ChatPanelProps.emptyStateProps.title',
                            control: textInput({bind: 'title', width: 140, commitOnChange: true})
                        }),
                        wrapperOption({
                            label: 'Text',
                            propName: 'ChatPanelProps.emptyStateProps.text',
                            control: textInput({bind: 'text', width: 140, commitOnChange: true})
                        }),
                        wrapperOption({
                            label: 'Icon',
                            propName: 'ChatPanelProps.emptyStateProps.icon',
                            info: 'Leads the text. Off passes null, for none.',
                            control: switchInput({bind: 'showIcon'})
                        }),
                        wrapperOption({
                            label: 'Header',
                            propName: 'ChatPanelProps.emptyStateProps.header',
                            info: 'A product mark above the heading.',
                            control: switchInput({bind: 'showHeader'})
                        }),
                        wrapperOption({
                            label: 'Below composer',
                            propName: 'ChatPanelProps.emptyStateProps.belowComposer',
                            info: 'A line of help under the centered composer.',
                            control: switchInput({bind: 'showBelowComposer'})
                        }),
                        wrapperOption({
                            label: 'Footer',
                            propName: 'ChatPanelProps.emptyStateProps.footer',
                            info: 'A note at the foot of the space under the composer.',
                            control: switchInput({bind: 'showFooter'})
                        }),
                        wrapperOption({
                            label: 'Suggestions',
                            propName: 'ChatPanelProps.suggestions',
                            info: 'How many cards to show.',
                            control: numberInput({
                                bind: 'suggestionCount',
                                min: 0,
                                max: SUGGESTIONS.length,
                                width: 60
                            })
                        }),
                        wrapperOption({
                            label: 'Descriptions and icons',
                            propName: 'ChatSuggestion.description',
                            info: 'Each card as a spec with a description and an icon, not a plain string.',
                            control: switchInput({bind: 'richSuggestions'})
                        })
                    ]
                }),
                wrapperAction({
                    icon: Icon.play(),
                    text: 'Replay settle',
                    intent: 'primary',
                    onClick: () => model.replaySettle()
                }),
                wrapperAction({
                    icon: Icon.reset(),
                    text: 'Clear conversation',
                    intent: 'danger',
                    disabled: chatModel.isEmpty && model.customChatModel.isEmpty,
                    onClick: () => model.clearAll()
                })
            ],
            item: demoPanel({
                className: 'tb-chatkit-empty',
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 560,
                            caption:
                                'Click a suggestion to fill the composer. Send to leave the empty state.',
                            config: model.configSnippet,
                            value: {
                                draft: chatModel.composerModel.text,
                                messages: chatModel.messages.length
                            },
                            item: div({
                                className: 'tb-chatkit-empty__instance',
                                item: chatPanel({
                                    key: `playground-${model.mountKey}`,
                                    model: chatModel,
                                    flex: 1,
                                    title: 'Assistant',
                                    icon: Icon.ai(),
                                    compactHeader: true,
                                    headerItems: [chatClearButton({chatModel})],
                                    emptyStateProps: model.emptyStateProps,
                                    suggestions: model.suggestions
                                })
                            })
                        })
                    }),
                    demoSection({
                        title: 'ChatEmptyState on its own',
                        note: 'chatEmptyState with a composerModel - for a layout of your own.',
                        item: demoFrame({
                            label: 'Empty state over a composer',
                            info: "A click fills the composer under it. The composer sends to a host of the page's own, which shows a toast.",
                            item: vbox({
                                className: 'tb-chatkit-empty__standalone',
                                items: [
                                    chatEmptyState({
                                        icon: Icon.search(),
                                        title: 'Ask the research desk',
                                        text: 'Search notes and filings by company, sector or theme.',
                                        suggestions: RESEARCH_SUGGESTIONS,
                                        composerModel: model.toastHost.composerModel
                                    }),
                                    chatComposer({
                                        model: model.toastHost.composerModel,
                                        placeholder: 'Search the research desk...'
                                    })
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'ChatSuggestions with onSelect',
                        note: 'onSelect replaces the fill - this one shows a toast and fills nothing.',
                        item: demoFrame({
                            label: 'Suggestions on their own',
                            info: 'chatSuggestions({suggestions, onSelect})',
                            item: div({
                                className: 'tb-chatkit-empty__suggestions',
                                item: chatSuggestions({
                                    suggestions: SUGGESTIONS.slice(0, 3),
                                    onSelect: onSuggestionSelect
                                })
                            })
                        })
                    }),
                    demoSection({
                        title: 'Custom emptyState',
                        note: 'emptyState replaces the default. The composer stays at the bottom.',
                        item: demoFrame({
                            label: 'Content of your own',
                            info: 'chatPanel({emptyState: templateGallery()}) - each tile fills the composer',
                            item: div({
                                className:
                                    'tb-chatkit-empty__instance tb-chatkit-empty__instance--custom',
                                item: chatPanel({
                                    model: model.customChatModel,
                                    flex: 1,
                                    title: 'Report builder',
                                    icon: Icon.fileText(),
                                    compactHeader: true,
                                    headerItems: [
                                        chatClearButton({chatModel: model.customChatModel})
                                    ],
                                    emptyState: templateGallery({chatModel: model.customChatModel}),
                                    composerProps: {placeholder: 'Describe a report...'}
                                })
                            })
                        })
                    })
                ]
            })
        });
    }
});

/** The custom empty state: tiles that start a report from a template. */
function templateGallery({chatModel}: {chatModel: ChatModel}): ReactNode {
    const {composerModel} = chatModel;
    return div({
        className: 'tb-chatkit-empty__gallery',
        items: [
            div({className: 'tb-chatkit-empty__gallery-title', item: 'Start from a template'}),
            div({
                className: 'tb-chatkit-empty__gallery-tiles',
                items: TEMPLATES.map(it =>
                    button({
                        key: it.title,
                        className: 'tb-chatkit-empty__tile',
                        minimal: false,
                        icon: it.icon,
                        text: it.title,
                        onClick: () => {
                            composerModel.text = it.prompt;
                            composerModel.focus();
                        }
                    })
                )
            })
        ]
    });
}

function onSuggestionSelect(suggestion: ChatSuggestion) {
    XH.toast({message: `Selected: ${suggestion.text}`, icon: Icon.sparkles()});
}

//------------------------------------------------------------------
// Models
//------------------------------------------------------------------
class EmptyStatePanelModel extends HoistModel {
    @managed chatModel = new ChatModel(createChatConfig());
    @managed customChatModel = new ChatModel(createChatConfig());
    @managed toastHost = new ToastHost();

    // Playground props
    @bindable accessor title = 'What should we look at?';
    @bindable accessor text = 'Ask about positions, P&L or risk. The replies are scripted.';
    @bindable accessor showIcon = true;
    @bindable accessor showHeader = false;
    @bindable accessor showBelowComposer = false;
    @bindable accessor showFooter = false;
    @bindable accessor suggestionCount = 3;
    @bindable accessor richSuggestions = true;

    /** Bumped to remount the Playground chat, so its empty state settles again. */
    @bindable accessor mountKey = 0;

    replaySettle() {
        this.chatModel.clear();
        this.mountKey++;
    }

    clearAll() {
        this.chatModel.clear();
        this.customChatModel.clear();
    }

    get emptyStateProps(): ChatPanelProps['emptyStateProps'] {
        return {
            title: this.title,
            text: this.text,
            icon: this.showIcon ? undefined : null,
            header: this.showHeader ? productMark() : null,
            belowComposer: this.showBelowComposer
                ? span({className: 'tb-chatkit-empty__note', item: HELP_LINE})
                : null,
            footer: this.showFooter
                ? span({className: 'tb-chatkit-empty__note', item: FOOTER_LINE})
                : null
        };
    }

    get suggestions(): Array<ChatSuggestion | string> {
        const ret = SUGGESTIONS.slice(0, this.suggestionCount);
        return this.richSuggestions ? ret : ret.map(it => it.text);
    }

    get configSnippet(): string {
        const {suggestionCount, richSuggestions} = this,
            shown = SUGGESTIONS.slice(0, suggestionCount);
        return fmtDemoConfig<ChatPanelProps>('chatPanel', {
            model: raw('chatModel'),
            emptyStateProps: rawObject({
                header: this.showHeader ? raw('productMark()') : undefined,
                title: this.title || undefined,
                text: this.text || undefined,
                icon: this.showIcon ? undefined : null,
                belowComposer: this.showBelowComposer ? raw(`span('${HELP_LINE}')`) : undefined,
                footer: this.showFooter ? raw(`span('${FOOTER_LINE}')`) : undefined
            }),
            suggestions: suggestionCount
                ? snippet(
                      arrayLiteral(
                          richSuggestions
                              ? shown.map(it =>
                                    raw(
                                        objectLiteral({
                                            text: it.text,
                                            description: it.description,
                                            icon: raw(it.iconCode)
                                        })
                                    )
                                )
                              : shown.map(it => it.text)
                      )
                  )
                : undefined
        });
    }
}

/** A host of the page's own for the standalone composer: it shows each message as a toast. */
class ToastHost extends HoistModel implements ChatComposerHost {
    readonly isBusy = false;

    @managed readonly composerModel = new ChatComposerModel({host: this, drafts: 'memory'});

    async sendAsync({text}: ChatSendSpec) {
        XH.toast({message: `Sent: ${text}`, icon: Icon.search()});
    }
}

//------------------------------------------------------------------
// Content
//------------------------------------------------------------------
const HELP_LINE = 'Shift+Enter starts a new line.',
    FOOTER_LINE = 'Replies are scripted. No model sees your questions.';

function productMark() {
    return div({
        className: 'tb-chatkit-empty__mark',
        items: [Icon.chartLine(), span('Ledger Assistant')]
    });
}

const SUGGESTIONS: Array<ChatSuggestion & {iconCode: string}> = [
    {
        text: 'Explain P&L for today',
        description: 'By book, with the largest moves',
        icon: Icon.chartLine(),
        iconCode: 'Icon.chartLine()'
    },
    {
        text: 'Check risk limits',
        description: 'Usage against each desk limit',
        icon: Icon.shieldHalved(),
        iconCode: 'Icon.shieldHalved()'
    },
    {
        text: 'Summarize open orders',
        description: 'Working orders and their fills',
        icon: Icon.list(),
        iconCode: 'Icon.list()'
    },
    {
        text: 'Find a trade',
        description: 'By id, symbol or counterparty',
        icon: Icon.search(),
        iconCode: 'Icon.search()'
    }
];

const RESEARCH_SUGGESTIONS: ChatSuggestion[] = [
    {text: 'Latest notes on semiconductors', icon: Icon.fileText()},
    {text: 'Earnings previews for this week', icon: Icon.calendar()},
    {text: 'Who covers European banks?', icon: Icon.users()}
];

const TEMPLATES = [
    {
        title: 'Daily P&L',
        icon: Icon.chartLine(),
        prompt: 'Build a daily P&L report by book, with the five largest moves.'
    },
    {
        title: 'Limit usage',
        icon: Icon.shieldHalved(),
        prompt: 'Build a report of limit usage by desk, sorted by usage.'
    },
    {
        title: 'Trade blotter',
        icon: Icon.list(),
        prompt: "Build a blotter of today's trades, grouped by trader."
    }
];

function createChatConfig(): ChatModelConfig {
    return {
        transport: new ScriptedChatTransport({
            delayMs: 15,
            respond: () => [
                scriptedDelay(600),
                textEvents(
                    'A scripted reply. Clear the conversation, or click **Replay settle**, to see the empty state again.'
                )
            ]
        }),
        composer: {drafts: 'memory'}
    };
}
