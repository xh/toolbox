import type {ChatComposerHost, ChatModelConfig, ChatSendSpec} from '@xh/hoist-chat-kit/core';
import {ChatComposerModel, ChatModel} from '@xh/hoist-chat-kit/core';
import type {
    ChatComposerButtonProps,
    ChatComposerProps,
    ChatScopeOption
} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {chatComposer, chatComposerPill, chatScopeChip} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {ScriptedChatTransport, scriptedDelay, textEvents} from '@xh/hoist-chat-kit/transport';
import {div, filler, hframe, span, vbox} from '@xh/hoist/cmp/layout';
import type {HoistProps} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {
    numberInput,
    segmentedControl,
    select,
    switchInput,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {fmtTime} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, bindableRef} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {isEmpty} from 'lodash';
import type {ReactNode} from 'react';
import {
    demoFrame,
    demoPanel,
    demoPlayground,
    demoSection,
    demoToolbar,
    fmtDemoConfig,
    raw
} from '../../../common/Demo';
import {wrapper, wrapperAction, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {chatKitPage} from '../ChatKitCatalog';
import {KIT_LINKS, tabSourceLink} from '../common/ChatDemo';
import {arrayLiteral, snippet} from '../common/ChatDemoUtils';
import './ComposerPanel.scss';

/**
 * The composer on its own: its slots, pills and Send and Stop over a `ChatModel`, then over a
 * host of the page's own, and in a toolbar.
 */
export const composerPanel = hoistCmp.factory({
    displayName: 'ComposerPanel',
    model: creates(() => ComposerPanelModel),

    render({model}) {
        const page = chatKitPage('composer'),
            {chatModel} = model,
            {composerModel} = chatModel;

        return wrapper({
            title: page.title,
            icon: page.icon(),
            description: [
                '`ChatComposer` is the input of a chat: one box with an auto-growing text area and',
                'a bar of pills, attach and Send. Enter sends and Shift+Enter starts a new line. Up',
                'arrow in an empty input recalls the last message.',
                '',
                'Its model is a `ChatComposerModel`. The Playground uses the `composerModel` of a',
                '`ChatModel`, so Send turns into Stop while the scripted reply runs, and Escape stops',
                'it too. The reply waits 2.5s before it answers, so you have time to see Stop.',
                '',
                'Five slots take content of your own: `topItems`, `startItems`, `leftItems`,',
                '`rightItems` and `bottomItems`. Pills in `leftItems` write to',
                '`chatModel.runOptions`, so each question records the choices it was asked with.'
            ],
            links: [
                KIT_LINKS.desktop,
                KIT_LINKS.core,
                tabSourceLink('components/ComposerPanel.ts'),
                {
                    url: '$CK/desktop/cmp/chat/ChatComposer.ts',
                    notes: 'Kit component, with the full doc comments.'
                },
                {
                    url: '$CK/core/ChatComposerModel.ts',
                    notes: 'The draft, attachments and status of the composer.'
                }
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground only - props',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    info: 'Drives the Playground composer. The other sections use their own models.',
                    items: [
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
                            label: 'Layout',
                            propName: 'ChatComposerProps.layout',
                            control: segmentedControl({
                                bind: 'layout',
                                fill: false,
                                compact: true,
                                options: ['stacked', 'inline']
                            })
                        }),
                        wrapperOption({
                            label: 'Max rows',
                            propName: 'ChatComposerProps.maxRows',
                            info: 'Rows the input grows to before it scrolls.',
                            control: numberInput({bind: 'maxRows', min: 1, max: 12, width: 60})
                        }),
                        wrapperOption({
                            label: 'Left items',
                            propName: 'ChatComposerProps.leftItems',
                            info: 'An agent pill, and a scope chip over five tools.',
                            control: switchInput({bind: 'showLeftItems'})
                        }),
                        wrapperOption({
                            label: 'Right items',
                            propName: 'ChatComposerProps.rightItems',
                            info: 'A context meter, before attach and Send.',
                            control: switchInput({bind: 'showRightItems'})
                        }),
                        wrapperOption({
                            label: 'Top items',
                            propName: 'ChatComposerProps.topItems',
                            info: 'Context chips, above the input.',
                            control: switchInput({bind: 'showTopItems'})
                        }),
                        wrapperOption({
                            label: 'Start items',
                            propName: 'ChatComposerProps.startItems',
                            info: 'A brand mark, before the text.',
                            control: switchInput({bind: 'showStartItems'})
                        }),
                        wrapperOption({
                            label: 'Breathe start items',
                            propName: 'ChatComposerProps.breatheStartItems',
                            info: 'The mark fades and shrinks a little while a reply runs.',
                            control: switchInput({bind: 'breatheStartItems'})
                        }),
                        wrapperOption({
                            label: 'Bottom items',
                            propName: 'ChatComposerProps.bottomItems',
                            info: "A model picker in a row of its own, with popoverAlign: 'end'.",
                            control: switchInput({bind: 'showBottomItems'})
                        }),
                        wrapperOption({
                            label: 'Send button',
                            propName: 'ChatComposerProps.sendButtonProps',
                            control: select({
                                bind: 'sendButton',
                                enableFilter: false,
                                width: 130,
                                options: [
                                    {value: 'default', label: 'Default'},
                                    {value: 'text', label: 'Text label'},
                                    {value: 'icon', label: 'Minimal arrow'}
                                ]
                            })
                        }),
                        wrapperOption({
                            label: 'Attachments',
                            propName: 'ChatComposerModel.enableAttachments',
                            info: 'A bindable on the model, not a prop. Adds the paperclip, paste and drop.',
                            control: switchInput({
                                model: composerModel,
                                bind: 'enableAttachments'
                            })
                        })
                    ]
                }),
                wrapperAction({
                    icon: Icon.reset(),
                    text: 'Clear messages',
                    intent: 'danger',
                    disabled: model.allEmpty,
                    onClick: () => model.clearAll()
                })
            ],
            item: demoPanel({
                className: 'tb-chatkit-composer',
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 560,
                            caption:
                                'Type and press Enter. Send becomes Stop while the reply runs. Open the pills to change the run options.',
                            config: model.configSnippet,
                            value: {
                                text: composerModel.text,
                                isBusy: chatModel.isBusy,
                                messages: chatModel.messages.length,
                                lastReply: chatModel.lastMessage?.isUser
                                    ? null
                                    : (chatModel.lastMessage?.text ?? null),
                                runOptions: chatModel.runOptions
                            },
                            item: div({
                                className: 'tb-chatkit-composer__instance',
                                item: chatComposer({
                                    model: composerModel,
                                    ...model.playgroundProps
                                })
                            })
                        })
                    }),
                    demoSection({
                        title: 'Without a ChatModel',
                        note: "A ChatComposerModel over a ChatComposerHost of the page's own.",
                        item: demoFrame({
                            label: 'Notes',
                            info: 'The host saves each sent message as a note. No Stop, drafts or status region.',
                            item: hframe({
                                className: 'tb-chatkit-composer__notes-host',
                                items: [
                                    div({
                                        className: 'tb-chatkit-composer__notes-composer',
                                        item: chatComposer({
                                            model: model.notesModel.composerModel,
                                            placeholder: 'Add a note...',
                                            maxRows: 4
                                        })
                                    }),
                                    notesList({model: model.notesModel})
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'In a toolbar',
                        note: "layout: 'inline' - a one-row composer beside other controls.",
                        item: demoToolbar({items: toolbarItems(model.toolbarChatModel)})
                    })
                ]
            })
        });
    }
});

function toolbarItems(chatModel: ChatModel): ReactNode[] {
    return [
        chatComposer({
            model: chatModel.composerModel,
            layout: 'inline',
            placeholder: 'Ask about this view...',
            flex: 1
        }),
        toolbarSep(),
        button({icon: Icon.refresh(), text: 'Refresh'})
    ];
}

//------------------------------------------------------------------
// Models
//------------------------------------------------------------------
type SendButtonStyle = 'default' | 'text' | 'icon';

class ComposerPanelModel extends HoistModel {
    @managed chatModel = new ChatModel(
        createChatConfig({
            runOptions: {agent: 'analyst', model: 'balanced', toolIds: ['positions', 'pnl']}
        })
    );
    @managed notesModel = new NotesModel();
    @managed toolbarChatModel = new ChatModel(createChatConfig());

    // Playground props
    @bindable accessor placeholder = 'Ask about your portfolio...';
    @bindable accessor layout: 'stacked' | 'inline' = 'stacked';
    @bindable accessor maxRows = 8;
    @bindable accessor showLeftItems = true;
    @bindable accessor showRightItems = false;
    @bindable accessor showTopItems = false;
    @bindable accessor showStartItems = false;
    @bindable accessor breatheStartItems = true;
    @bindable accessor showBottomItems = false;
    @bindable accessor sendButton: SendButtonStyle = 'default';

    get allEmpty(): boolean {
        return this.chatModels.every(it => it.isEmpty) && isEmpty(this.notesModel.notes);
    }

    clearAll() {
        this.chatModels.forEach(it => it.clear());
        this.notesModel.notes = [];
    }

    /** Props for the Playground composer, from the rail. */
    get playgroundProps(): ChatComposerProps {
        return {
            placeholder: this.placeholder,
            layout: this.layout,
            maxRows: this.maxRows,
            leftItems: this.showLeftItems ? [this.agentPill(), this.toolsChip()] : null,
            rightItems: this.showRightItems ? contextMeter() : null,
            topItems: this.showTopItems ? contextChips() : null,
            startItems: this.showStartItems ? brandMark() : null,
            breatheStartItems: this.breatheStartItems,
            bottomItems: this.showBottomItems ? [filler(), this.modelPill()] : null,
            sendButtonProps: SEND_BUTTONS[this.sendButton]
        };
    }

    /** The snippet for the Playground composer, with only the props that differ from the default. */
    get configSnippet(): string {
        return fmtDemoConfig<ChatComposerProps>('chatComposer', {
            model: raw('chatModel.composerModel'),
            placeholder: this.placeholder || undefined,
            layout: this.layout === 'inline' ? 'inline' : undefined,
            maxRows: this.maxRows !== 8 ? this.maxRows : undefined,
            topItems: this.showTopItems ? raw('contextChips()') : undefined,
            startItems: this.showStartItems
                ? raw("Icon.ai({className: 'my-brand-mark'})")
                : undefined,
            breatheStartItems: this.breatheStartItems ? undefined : false,
            leftItems: this.showLeftItems
                ? snippet(
                      arrayLiteral([
                          raw(
                              "chatComposerPill({\n    text: 'Analyst',\n    icon: Icon.user(),\n    menuItems: AGENT_ITEMS\n})"
                          ),
                          raw(
                              "chatScopeChip({\n    options: TOOLS,\n    noun: 'tool',\n    icon: Icon.tools(),\n    runOption: 'toolIds'\n})"
                          )
                      ])
                  )
                : undefined,
            rightItems: this.showRightItems ? raw("span('12% of context')") : undefined,
            bottomItems: this.showBottomItems
                ? snippet(
                      arrayLiteral([
                          raw('filler()'),
                          raw(
                              "chatComposerPill({\n    text: 'Balanced',\n    icon: Icon.bolt(),\n    menuItems: MODEL_ITEMS,\n    popoverAlign: 'end'\n})"
                          )
                      ])
                  )
                : undefined,
            sendButtonProps: SEND_BUTTON_CODE[this.sendButton]
        });
    }

    //------------------------
    // Implementation
    //------------------------
    private get chatModels(): ChatModel[] {
        return [this.chatModel, this.toolbarChatModel];
    }

    private setRunOption(key: string, value: unknown) {
        const {chatModel} = this;
        chatModel.runOptions = {...chatModel.runOptions, [key]: value};
    }

    private agentPill() {
        const agent = AGENTS.find(it => it.id === this.chatModel.runOptions?.agent) ?? AGENTS[0];
        return chatComposerPill({
            icon: agent.icon,
            text: agent.name,
            tooltip: 'The agent that answers',
            menuItems: AGENTS.map(it => ({
                text: it.name,
                icon: it.icon,
                onClick: () => this.setRunOption('agent', it.id)
            }))
        });
    }

    private toolsChip() {
        return chatScopeChip({
            model: this.chatModel,
            options: TOOLS,
            noun: 'tool',
            icon: Icon.tools(),
            runOption: 'toolIds'
        });
    }

    private modelPill() {
        const current = MODELS.find(it => it.id === this.chatModel.runOptions?.model) ?? MODELS[0];
        return chatComposerPill({
            icon: Icon.bolt(),
            text: current.name,
            tooltip: 'The model that answers',
            popoverAlign: 'end',
            menuItems: MODELS.map(it => ({
                text: it.name,
                secondaryText: it.info,
                onClick: () => this.setRunOption('model', it.id)
            }))
        });
    }
}

interface Note {
    id: number;
    text: string;
    time: number;
}

/** A host of the page's own for a composer: each message it is sent becomes a note. */
class NotesModel extends HoistModel implements ChatComposerHost {
    @bindable accessor isBusy = false;
    @bindableRef accessor notes: Note[] = [];

    @managed readonly composerModel = new ChatComposerModel({host: this, drafts: 'memory'});

    /** For the composer's Up arrow, which recalls the last message. */
    get messages() {
        return this.notes.map(it => ({isUser: true, text: it.text}));
    }

    async sendAsync({text}: ChatSendSpec) {
        this.isBusy = true;
        try {
            await wait(400);
            this.notes = [...this.notes, {id: Date.now(), text, time: Date.now()}];
        } finally {
            this.isBusy = false;
        }
    }
}

const notesList = hoistCmp.factory<HoistProps<NotesModel>>({
    displayName: 'ComposerNotesList',
    model: uses(NotesModel),

    render({model}) {
        const {notes} = model;
        return vbox({
            className: 'tb-chatkit-composer__notes',
            items: isEmpty(notes)
                ? span({className: 'tb-chatkit-composer__notes-empty', item: 'No notes yet.'})
                : notes.map(it =>
                      div({
                          key: it.id,
                          className: 'tb-chatkit-composer__note',
                          items: [
                              span({
                                  className: 'tb-chatkit-composer__note-time',
                                  item: fmtTime(it.time)
                              }),
                              span(it.text)
                          ]
                      })
                  )
        });
    }
});

//------------------------------------------------------------------
// Slot content and script
//------------------------------------------------------------------
function contextMeter() {
    return span({className: 'tb-chatkit-composer__meter', item: '12% of context'});
}

function contextChips() {
    return div({
        className: 'tb-chatkit-composer__chips',
        items: [
            span({
                className: 'tb-chatkit-composer__chip',
                items: [Icon.portfolio(), 'Rates book']
            }),
            span({className: 'tb-chatkit-composer__chip', items: [Icon.table(), 'Positions grid']})
        ]
    });
}

function brandMark() {
    return Icon.ai({className: 'tb-chatkit-composer__mark'});
}

const AGENTS = [
    {id: 'analyst', name: 'Analyst', icon: Icon.user()},
    {id: 'risk', name: 'Risk Officer', icon: Icon.shieldHalved()},
    {id: 'research', name: 'Researcher', icon: Icon.search()}
];

const MODELS = [
    {id: 'fast', name: 'Fast', info: 'Quick answers'},
    {id: 'balanced', name: 'Balanced', info: 'The default'},
    {id: 'deep', name: 'Deep', info: 'Slower, thinks longer'}
];

const TOOLS: ChatScopeOption[] = [
    {
        id: 'positions',
        name: 'Positions',
        icon: Icon.portfolio(),
        disabled: true,
        secondaryText: 'Always on'
    },
    {id: 'pnl', name: 'P&L history', icon: Icon.chartLine()},
    {id: 'marketData', name: 'Market data', icon: Icon.globe()},
    {id: 'riskLimits', name: 'Risk limits', icon: Icon.shieldHalved()},
    {id: 'search', name: 'Research search', icon: Icon.search()}
];

const SEND_BUTTONS: Record<SendButtonStyle, ChatComposerButtonProps> = {
    default: undefined,
    text: {text: 'Send'},
    icon: {icon: Icon.arrowRight(), minimal: true}
};

const SEND_BUTTON_CODE: Record<SendButtonStyle, {raw: string}> = {
    default: undefined,
    text: raw("{text: 'Send'}"),
    icon: raw('{icon: Icon.arrowRight(), minimal: true}')
};

function createChatConfig(config: Partial<ChatModelConfig> = {}): ChatModelConfig {
    return {
        transport: new ScriptedChatTransport({
            delayMs: 15,
            respond: request => {
                const {agent, model, toolIds} = request.runOptions ?? {},
                    asked = agent
                        ? ` Asked of ${agent}, on ${model}, with ${toolIds?.length ?? 0} tools.`
                        : '';
                return [scriptedDelay(2500), textEvents(`A scripted reply.${asked}`)];
            }
        }),
        composer: {drafts: 'memory'},
        ...config
    };
}
