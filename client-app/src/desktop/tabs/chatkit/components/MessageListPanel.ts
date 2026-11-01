import type {
    ChatMessageSpec,
    ChatToolCallPart,
    ChatToolSpec,
    ChatTranscript
} from '@xh/hoist-chat-kit/core';
import {ChatMessage, ChatModel} from '@xh/hoist-chat-kit/core';
import type {ChatMessageListProps} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {chatMessageList, chatMessageView} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {ScriptedChatTransport, scriptedDelay, textEvents} from '@xh/hoist-chat-kit/transport';
import {box, span} from '@xh/hoist/cmp/layout';
import type {ReactNode} from 'react';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable, observableRef} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import digestImage from '../../../../core/img/stock-news.png';
import {
    demoFrame,
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    fmtDemoConfig,
    raw
} from '../../../common/Demo';
import {wrapper, wrapperAction, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {chatKitPage} from '../ChatKitCatalog';
import {KIT_LINKS, tabSourceLink} from '../common/ChatDemo';
import {createSampleConversation} from '../common/sampleConversation';
import {markdown} from '../common/scriptUtils';
import './MessageListPanel.scss';

export const messageListPanel = hoistCmp.factory({
    displayName: 'MessageListPanel',
    model: creates(() => MessageListPanelModel),

    render({model}) {
        const page = chatKitPage('messageList'),
            {
                transcript,
                assistantName,
                showMessageHeader,
                citationMarkers,
                withActions,
                withHeaderItems,
                allowImages
            } = model,
            messageActions = withActions ? model.renderActions : undefined,
            messageHeaderItems = withHeaderItems ? model.renderHeaderItems : undefined;

        return wrapper({
            title: page.title,
            icon: page.icon(),
            description: [
                '`ChatMessageList` is the scrolling conversation inside `ChatPanel`. It renders a',
                "`ChatModel`, or any `ChatTranscript` passed as `host`, read-only - an admin's chat",
                'log, say, or a saved conversation.',
                '',
                'The Playground host is a plain `HoistModel` with observable `messages` and a',
                '`getToolSpec` that gives `query_exposure` its title, icon and summary. Every part',
                'renders, with Copy and any `messageActions`. Edit, Regenerate and the thumbs need',
                'the turn loop, so they show only for a `ChatModel`.',
                '',
                '`messageActions` and `messageHeaderItems` are props of memoized views. Pass a',
                'stable function, such as an arrow function field on a model, or every message',
                're-renders.',
                '',
                '**Kit API:** `chatMessageList`, `ChatTranscript`, `chatMessageView`,',
                '`ChatToolSpec.summary`'
            ],
            links: [
                {
                    url: '$CK/desktop/cmp/chat/README.md#show-messages-without-a-chatmodel',
                    text: 'Show messages without a ChatModel',
                    notes: 'A `ChatTranscript` as the host.'
                },
                {
                    url: '$CK/desktop/cmp/chat/README.md#add-message-actions-such-as-feedback',
                    text: 'Message actions',
                    notes: 'Buttons in the action bar, and items in the header.'
                },
                {
                    url: '$CK/desktop/cmp/chat/README.md#chatmessagelist',
                    text: 'ChatMessageList props',
                    notes: 'The full list, with the keyboard.'
                },
                KIT_LINKS.desktop,
                tabSourceLink('components/MessageListPanel.ts')
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground only - props',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    info: 'Drives the Playground list over its transcript.',
                    items: [
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
                            info: "Off leaves out each reply's header line and all it holds.",
                            control: switchInput({bind: 'showMessageHeader'})
                        }),
                        wrapperOption({
                            label: 'Citation markers',
                            propName: 'ChatMessageListProps.citationMarkers',
                            info: 'Renders [1] and [2] in the last reply as markers for its sources.',
                            control: switchInput({bind: 'citationMarkers'})
                        }),
                        wrapperOption({
                            label: 'Message actions',
                            propName: 'ChatMessageListProps.messageActions',
                            info: 'Adds Pin and Share to each reply, after Copy.',
                            control: switchInput({bind: 'withActions'})
                        }),
                        wrapperOption({
                            label: 'Header items',
                            propName: 'ChatMessageListProps.messageHeaderItems',
                            info: 'Adds a badge with the model that answered.',
                            control: switchInput({bind: 'withHeaderItems'})
                        }),
                        wrapperOption({
                            label: 'Allow images',
                            propName: 'ChatMessageListProps.allowImages',
                            info: 'The last reply holds an image. Off, it shows as a link.',
                            control: switchInput({bind: 'allowImages'})
                        })
                    ]
                }),
                wrapperAction({
                    icon: Icon.reset(),
                    text: 'Reset the live chat',
                    onClick: () => model.resetLiveChat()
                })
            ],
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 600,
                            showValue: false,
                            caption: 'A read-only transcript. Hover a reply for its action bar.',
                            config: fmtDemoConfig<ChatMessageListProps>('chatMessageList', {
                                host: raw('transcript'),
                                assistantName: assistantName || undefined,
                                showMessageHeader: showMessageHeader ? undefined : false,
                                citationMarkers: citationMarkers || undefined,
                                messageActions: withActions ? raw('this.renderActions') : undefined,
                                messageHeaderItems: withHeaderItems
                                    ? raw('this.renderHeaderItems')
                                    : undefined,
                                allowImages: allowImages || undefined
                            }),
                            item: box({
                                className: 'tb-chatkit-message-list__frame',
                                height: 480,
                                width: '100%',
                                item: chatMessageList({
                                    host: transcript,
                                    assistantName,
                                    showMessageHeader,
                                    citationMarkers,
                                    messageActions,
                                    messageHeaderItems,
                                    allowImages,
                                    flex: 1
                                })
                            })
                        })
                    }),
                    demoSection({
                        title: 'Live ChatModel',
                        note: 'The same messages as initialMessages of a ChatModel.',
                        item: demoFrame({
                            label: 'chatMessageList({model: chatModel})',
                            info: 'Edit, Regenerate and the thumbs show only for a ChatModel. Regenerate the last reply, or edit a question.',
                            item: box({
                                height: 480,
                                item: chatMessageList({
                                    model: model.chatModel,
                                    assistantName: 'Research Assistant',
                                    citationMarkers: true,
                                    flex: 1
                                })
                            })
                        })
                    }),
                    demoSection({
                        title: 'One message',
                        note: 'chatMessageView, for a list of your own.',
                        item: demoRow({
                            label: 'A reply with reasoning, a tool call and a table',
                            info: 'chatMessageView({message, host: transcript}) - the tool call takes its title, icon and summary from getToolSpec.',
                            item: chatMessageView({
                                message: transcript.messages[1],
                                host: transcript,
                                assistantName: 'Research Assistant'
                            })
                        })
                    })
                ]
            })
        });
    }
});

//------------------------------------------------------------------
// Sample data
//------------------------------------------------------------------
/** How calls to the sample's backend tool display: its title, icon and a one-line summary. */
const QUERY_EXPOSURE: ChatToolSpec = {
    name: 'query_exposure',
    displayName: 'Query exposure',
    icon: Icon.database(),
    summary: (part: ChatToolCallPart) => `As of ${part.input?.asOf ?? 'today'}`
};

const IMAGE_TURN: ChatMessageSpec[] = [
    {
        id: 'u3',
        role: 'user',
        content: "Show me the cover of this morning's research digest.",
        status: 'complete',
        createdAt: Date.now() - 60_000
    },
    {
        id: 'a3',
        role: 'assistant',
        status: 'complete',
        createdAt: Date.now() - 59_000,
        metadata: {elapsedMs: 1_400},
        parts: [
            {
                id: 'a3-x',
                type: 'text',
                state: 'done',
                text: markdown(`
                    Here is the cover of today's digest. It leads with the rates outlook.

                    ![Morning research digest](${digestImage})
                `)
            }
        ]
    }
];

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
class MessageListPanelModel extends HoistModel {
    readonly transcript = new SampleTranscript();

    @managed readonly chatModel = new ChatModel({
        transport: new ScriptedChatTransport({
            delayMs: 15,
            respond: () => [
                scriptedDelay(600),
                textEvents(
                    'Technology is still the desk to act on: **112%** of its gross limit, ' +
                        'with Regional Banks at **104%**. Energy has $32m of room.'
                )
            ]
        }),
        tools: [QUERY_EXPOSURE],
        initialMessages: createSampleConversation(),
        // A submitter, so that the thumbs show. A real app posts the spec to its server.
        feedback: {submitAsync: () => wait(300)}
    });

    @bindable accessor assistantName = 'Research Assistant';
    @bindable accessor showMessageHeader = true;
    @bindable accessor citationMarkers = false;
    @bindable accessor withActions = false;
    @bindable accessor withHeaderItems = false;
    @bindable accessor allowImages = false;

    // Arrow function fields, so that the props stay the same functions across renders.
    renderActions = (message: ChatMessage): ReactNode[] => {
        if (!message.isAssistant) return [];
        return [
            button({
                key: 'pin',
                icon: Icon.pin(),
                tooltip: 'Pin',
                onClick: () => XH.toast({icon: Icon.pin(), message: 'Pinned the reply.'})
            }),
            button({
                key: 'share',
                icon: Icon.envelope(),
                tooltip: 'Share',
                onClick: () => XH.toast({icon: Icon.envelope(), message: 'Shared the reply.'})
            })
        ];
    };

    renderHeaderItems = (): ReactNode[] => [
        span({key: 'model', className: 'tb-chatkit-message-list__badge', item: 'analyst-large'})
    ];

    resetLiveChat() {
        this.chatModel.loadMessages(createSampleConversation());
    }
}

/** A read-only conversation of the app's own: the sample, then a reply with an image. */
class SampleTranscript extends HoistModel implements ChatTranscript {
    @observableRef accessor messages: ChatMessage[] = [
        ...createSampleConversation(),
        ...IMAGE_TURN
    ].map(it => new ChatMessage(it));

    getToolSpec = (name: string): ChatToolSpec =>
        name === QUERY_EXPOSURE.name ? QUERY_EXPOSURE : null;
}
