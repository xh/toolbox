import type {
    ChatFeedback,
    ChatFeedbackHost,
    ChatFeedbackSettings,
    ChatFeedbackSpec,
    ChatTextPart
} from '@xh/hoist-chat-kit/core';
import {ChatMessage, ChatModel} from '@xh/hoist-chat-kit/core';
import {chatMarkdown} from '@xh/hoist-chat-kit/cmp/markdown';
import type {ChatFeedbackControlsProps} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {chatCopyButton, chatFeedbackControls, chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {ScriptedChatTransport, scriptedDelay, textEvents} from '@xh/hoist-chat-kit/transport';
import {box, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {numberInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, computed, observableRef} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {isNil, omitBy} from 'lodash';
import {
    demoFrame,
    demoPanel,
    demoPlayground,
    demoSection,
    fmtDemoConfig,
    fmtDemoValue,
    raw
} from '../../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {chatKitPage} from '../ChatKitCatalog';
import {KIT_LINKS, tabSourceLink} from '../common/ChatDemo';
import {createSampleConversation} from '../common/sampleConversation';
import './FeedbackPanel.scss';

export const feedbackPanel = hoistCmp.factory({
    displayName: 'FeedbackPanel',
    model: creates(() => FeedbackPanelModel),

    render({model}) {
        const page = chatKitPage('feedback'),
            {reply} = model;

        return wrapper({
            title: page.title,
            icon: page.icon(),
            description: [
                'Each reply shows thumbs up and down once its turn ends, when the chat can submit',
                'feedback. A thumbs up saves on click. A thumbs down opens a comment form inline,',
                'under the action bar. Failures show inline with Retry, never as a toast.',
                '',
                '`ChatFeedbackControls` show the same thumbs and form for a reply the app lays',
                'out itself. They need no `ChatModel`: the Playground host is a plain `HoistModel`',
                'that implements `ChatFeedbackHost`, with observable ratings, `getFeedback`, a',
                '`submitFeedbackAsync` with some latency, and `feedbackSettings` from the rail.',
                '',
                'A rejection with an `httpStatus` of 400, 413 or 422 counts as refused: the form',
                'shows the reason under the field, with no Retry.',
                '',
                '**Kit API:** `chatFeedbackControls`, `ChatFeedbackHost`, `ChatFeedbackSettings`,',
                '`ChatModelConfig.feedback`, `ChatFeedbackSpec`'
            ],
            links: [
                {
                    url: '$CK/desktop/cmp/chat/README.md#collect-feedback',
                    text: 'Collect feedback',
                    notes: 'The thumbs, the comment form and its failures.'
                },
                {
                    url: '$CK/desktop/cmp/chat/README.md#collect-feedback-without-a-chatmodel',
                    text: 'Feedback without a ChatModel',
                    notes: "`ChatFeedbackControls` over a host of the app's own."
                },
                {
                    url: '$CK/core/README.md#rate-a-reply',
                    text: 'Rate a reply',
                    notes: 'The feedback config and the spec the backend receives.'
                },
                KIT_LINKS.desktop,
                tabSourceLink('components/FeedbackPanel.ts')
            ],
            options: wrapperOptionGroup({
                label: 'Playground only - feedbackSettings',
                icon: Icon.experiment(),
                intent: 'primary',
                info: 'Drives the Playground host. The chat below has a feedback config of its own.',
                items: [
                    wrapperOption({
                        label: 'Allow comment',
                        propName: 'ChatFeedbackSettings.allowComment',
                        info: 'Off, both thumbs save on click and offer no form.',
                        control: switchInput({bind: 'allowComment'})
                    }),
                    wrapperOption({
                        label: 'Require comment',
                        propName: 'ChatFeedbackSettings.requireComment',
                        info: 'A thumbs down saves nothing until the comment is sent.',
                        control: switchInput({bind: 'requireComment'})
                    }),
                    wrapperOption({
                        label: 'Clearable',
                        propName: 'ChatFeedbackSettings.clearable',
                        info: 'A click on the chosen thumb clears the rating.',
                        control: switchInput({bind: 'clearable'})
                    }),
                    wrapperOption({
                        label: 'Allow change',
                        propName: 'ChatFeedbackSettings.allowChange',
                        info: 'Off, a rating locks once it saves. A comment can still follow.',
                        control: switchInput({bind: 'allowChange'})
                    }),
                    wrapperOption({
                        label: 'Max comment length',
                        propName: 'ChatFeedbackSettings.maxCommentLength',
                        info: 'A counter shows from 90%. Clear it for null, no limit.',
                        control: numberInput({
                            bind: 'maxCommentLength',
                            min: 10,
                            width: 80,
                            placeholder: 'None'
                        })
                    }),
                    wrapperOption({
                        label: 'Can rate',
                        propName: 'ChatFeedbackSettings.canRate',
                        info: 'Off, canRate returns false: the thumbs go, the Copy button stays.',
                        control: switchInput({bind: 'canRateReply'})
                    }),
                    wrapperOption({
                        label: 'Next save',
                        info: 'Make the next save fail, to see the inline error. Retry then succeeds.',
                        control: select({
                            bind: 'nextSave',
                            width: 130,
                            enableFilter: false,
                            options: [
                                {label: 'Succeeds', value: 'ok'},
                                {label: 'Fails', value: 'fail'},
                                {label: 'Refused (422)', value: 'refuse'}
                            ]
                        })
                    })
                ]
            }),
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 460,
                            caption:
                                'Saves take 600ms. Try a thumbs down, then switch thumbs or clear the rating.',
                            config: model.snippet,
                            value: model.getFeedback(reply),
                            item: vbox({
                                className: 'tb-chatkit-feedback__reply',
                                items: [
                                    chatMarkdown({content: model.replyText}),
                                    chatFeedbackControls({
                                        message: reply,
                                        host: model,
                                        items: [chatCopyButton({getCopyText: () => reply.text})]
                                    })
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'In a reply',
                        note: 'chatPanel over a ChatModel with a feedback config.',
                        item: demoFrame({
                            label: 'feedback: {submitAsync, requireComment: true, clearable: false}',
                            info: 'Thumbs show at once on the loaded history. A thumbs down needs a comment, and a rating cannot be cleared.',
                            item: box({
                                height: 560,
                                item: chatPanel({
                                    model: model.chatModel,
                                    flex: 1,
                                    citationMarkers: true,
                                    messageListProps: {assistantName: 'Research Assistant'},
                                    suggestions: ['Summarize the limit breaches']
                                })
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
type NextSave = 'ok' | 'fail' | 'refuse';

/**
 * The page model, and the Playground's feedback host: a conversation of the app's own, with its
 * ratings in an observable map and a submit that takes a moment, as a server would.
 */
class FeedbackPanelModel extends HoistModel implements ChatFeedbackHost {
    readonly threadId = 'feedback-playground';

    /** The reply the Playground rates: the sample's first, with its table. */
    readonly reply = new ChatMessage(createSampleConversation()[1]);

    /** The reply's text, without its reasoning and tool call. */
    readonly replyText = this.reply.parts
        .filter((it): it is ChatTextPart => it.type === 'text')
        .map(it => it.text)
        .join('\n\n');

    @managed readonly chatModel = new ChatModel({
        transport: new ScriptedChatTransport({
            delayMs: 15,
            respond: () => [
                scriptedDelay(500),
                textEvents(
                    'Two desks are over their gross limit: **Technology** at 112% and ' +
                        '**Regional Banks** at 104%. Rate this reply with the thumbs below it.'
                )
            ]
        }),
        initialMessages: createSampleConversation(),
        feedback: {
            submitAsync: async ({rating, comment}) => {
                await wait(500);
                XH.toast({
                    icon: Icon.check(),
                    message: rating
                        ? `Saved ${rating} feedback${comment ? `: "${comment}"` : '.'}`
                        : 'Cleared the rating.'
                });
            },
            requireComment: true,
            clearable: false
        }
    });

    // Feedback settings, from the rail.
    @bindable accessor allowComment = true;
    @bindable accessor requireComment = false;
    @bindable accessor clearable = true;
    @bindable accessor allowChange = true;
    @bindable accessor maxCommentLength: number = 1000;
    @bindable accessor canRateReply = true;
    @bindable accessor nextSave: NextSave = 'ok';

    /** Saved feedback, by message id. */
    @observableRef accessor ratings: Record<string, ChatFeedback> = {};

    //------------------------
    // ChatFeedbackHost
    //------------------------
    @computed
    get feedbackSettings(): ChatFeedbackSettings {
        return {
            allowComment: this.allowComment,
            requireComment: this.requireComment,
            clearable: this.clearable,
            allowChange: this.allowChange,
            maxCommentLength: this.maxCommentLength,
            canRate: this.canRateReply ? undefined : NO_RATING
        };
    }

    getFeedback(message: ChatMessage): ChatFeedback {
        return this.ratings[message.id] ?? null;
    }

    async submitFeedbackAsync(spec: ChatFeedbackSpec): Promise<void> {
        const outcome = this.nextSave;
        this.nextSave = 'ok';
        await wait(600);

        if (outcome === 'fail') throw new Error('The feedback service did not respond.');
        if (outcome === 'refuse') {
            throw Object.assign(new Error('Comments may not include account numbers.'), {
                httpStatus: 422
            });
        }
        this.saveRating(spec);
    }

    //------------------------
    // Snippet
    //------------------------
    @computed
    get snippet(): string {
        const controls = fmtDemoConfig<ChatFeedbackControlsProps>('chatFeedbackControls', {
                message: raw('message'),
                host: raw('feedbackHost'),
                items: raw('[chatCopyButton({getCopyText: () => message.text})]')
            }),
            settings = omitBy(
                {
                    allowComment: this.allowComment ? undefined : false,
                    requireComment: this.requireComment || undefined,
                    clearable: this.clearable ? undefined : false,
                    allowChange: this.allowChange ? undefined : false,
                    maxCommentLength:
                        this.maxCommentLength === 1000 ? undefined : this.maxCommentLength,
                    canRate: this.canRateReply ? undefined : raw('() => false')
                },
                it => it === undefined
            ),
            lines = Object.entries(settings).map(
                ([k, v]) => `    ${k}: ${isRaw(v) ? v.raw : fmtDemoValue(v)}`
            );
        return [
            controls,
            '',
            '// On the host, a ChatFeedbackHost',
            lines.length
                ? `feedbackSettings = {\n${lines.join(',\n')}\n};`
                : 'feedbackSettings = {};'
        ].join('\n');
    }

    //------------------------
    // Implementation
    //------------------------
    @action
    private saveRating({messageId, rating, comment}: ChatFeedbackSpec) {
        this.ratings = {
            ...this.ratings,
            [messageId]: rating ? (omitBy({rating, comment}, isNil) as ChatFeedback) : null
        };
    }
}

const NO_RATING = () => false;

function isRaw(v: unknown): v is {raw: string} {
    return !!v && typeof v === 'object' && 'raw' in v;
}
