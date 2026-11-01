import type {ChatModelConfig} from '@xh/hoist-chat-kit/core';
import {ChatModel} from '@xh/hoist-chat-kit/core';
import type {ChatSuggestion} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {chatClearButton, chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import type {HoistProps} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed, uses} from '@xh/hoist/core';
import {switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import classNames from 'classnames';
import {isEmpty} from 'lodash';
import type {ToolboxLinkProps} from '../../../../core/cmp/ToolboxLink';
import {wrapper, wrapperAction, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import type {ChatKitPage} from '../ChatKitCatalog';
import {chatKitPage} from '../ChatKitCatalog';

/**
 * Links to the kit's docs and source, for the rail of any Chat Kit page. The `$CK` token routes a
 * markdown doc into Toolbox's own doc viewer, and a source path to the kit's GitHub repo.
 */
export const KIT_LINKS = {
    readme: {
        url: '$CK/README.md',
        text: 'Hoist Chat Kit',
        notes: 'The kit: what it provides and how to install it.'
    },
    docsIndex: {
        url: '$CK/docs/README.md',
        text: 'Documentation index',
        notes: 'Every doc, with a quick reference by task.'
    },
    core: {
        url: '$CK/core/README.md',
        text: 'Core models',
        notes: '`ChatModel`, messages, parts, tools and the composer model.'
    },
    transport: {
        url: '$CK/transport/README.md',
        text: 'Transports and codecs',
        notes: 'Scripted, Hoist, SSE and HTTP transports, and the codecs.'
    },
    desktop: {
        url: '$CK/desktop/cmp/chat/README.md',
        text: 'Desktop chat components',
        notes: 'Panel, list, composer, tool cards, sources and theming.'
    },
    genui: {
        url: '$CK/genui/README.md',
        text: 'Generative UI',
        notes: 'The catalog of components a model can show inline.'
    },
    genuiCmps: {
        url: '$CK/desktop/cmp/genui/README.md',
        text: 'Built-in generative UI components',
        notes: 'The grid, chart, metrics and card specs.'
    },
    markdown: {
        url: '$CK/cmp/markdown/README.md',
        text: 'Streaming markdown',
        notes: 'The renderer behind every reply.'
    },
    threads: {
        url: '$CK/threads/README.md',
        text: 'Thread layer',
        notes: '`ChatThreadsModel` and the `ChatThreadStore` an app implements.'
    },
    workspace: {
        url: '$CK/desktop/cmp/workspace/README.md',
        text: 'Desktop workspace',
        notes: 'The full-page chat with a thread sidebar.'
    },
    threadList: {
        url: '$CK/desktop/cmp/threads/README.md',
        text: 'Desktop thread list',
        notes: 'The sidebar list of threads.'
    },
    architecture: {
        url: '$CK/docs/architecture.md',
        text: 'Architecture',
        notes: 'Layers, the flow of one turn and the extension seams.'
    },
    protocols: {
        url: '$CK/docs/protocols.md',
        text: 'Protocols',
        notes: 'AG-UI, Anthropic, OpenAI, A2UI, OpenUI and the Vercel AI SDK.'
    }
} satisfies Record<string, ToolboxLinkProps>;

/** The Toolbox source link for a file under the Chat Kit tab's folder. */
export function tabSourceLink(path: string, notes = 'This example.'): ToolboxLinkProps {
    return {url: `$TB/client-app/src/desktop/tabs/chatkit/${path}`, notes};
}

/**
 * One scripted conversation in the Conversations group. Each runs its own `ChatModel`, on a
 * `ScriptedChatTransport` for all but the live demo, so it needs no server, model or API key.
 */
export interface ChatDemoSpec {
    /** Id of the page in the catalog, which supplies the title and icon. */
    pageId: string;

    /** Rail intro, as markdown lines - what the demo shows and what to watch for. */
    description: string[];

    /** Kit APIs the demo rests on, listed in the rail as code. */
    kitApi?: string[];

    /** Rail links beyond this demo's own source. */
    links?: ToolboxLinkProps[];

    /** Heading for the empty conversation - what to try. */
    heading: string;

    /** Supporting text for the empty conversation - what to try and what to watch for. */
    intro: string;

    /** Prompts offered in the empty conversation. Any message gets the demo's reply. */
    suggestions: Array<ChatSuggestion | string>;

    /** Placeholder for the composer. */
    placeholder?: string;

    /** Name on the assistant's replies. Default 'Chat Kit'. */
    assistantName?: string;

    /** Creates the config for the demo's ChatModel - its transport, tools and composer. */
    createChatConfig: () => ChatModelConfig;
}

/** The model behind a conversation page: the demo's `ChatModel` and the rail's display options. */
export class ChatDemoModel extends HoistModel {
    readonly spec: ChatDemoSpec;
    readonly page: ChatKitPage;

    @managed readonly chatModel: ChatModel;

    /** Name on the assistant's replies. */
    @bindable accessor assistantName: string;
    /** `ChatMessageListProps.showMessageHeader`. */
    @bindable accessor showMessageHeader = true;
    /** True to add `xh-chat--compact` above the chat, for a narrow host. */
    @bindable accessor compact = false;
    /** True to add `xh-chat--reduced-motion` above the chat, for the static twins of its cues. */
    @bindable accessor reducedMotion = false;

    constructor(spec: ChatDemoSpec) {
        super();
        this.spec = spec;
        this.page = chatKitPage(spec.pageId);
        this.assistantName = spec.assistantName ?? 'Chat Kit';
        this.chatModel = new ChatModel(spec.createChatConfig());
    }
}

/** The page for a conversation demo: a rail with the intro and display options, and its chat. */
export const chatDemoPage = hoistCmp.factory<HoistProps<ChatDemoModel>>({
    displayName: 'ChatDemoPage',
    model: uses(ChatDemoModel),

    render({model}) {
        const {spec, page, chatModel, assistantName, showMessageHeader, compact, reducedMotion} =
                model,
            title = page.title,
            icon = page.icon();

        return wrapper({
            title,
            icon,
            description: [
                ...spec.description,
                ...(isEmpty(spec.kitApi)
                    ? []
                    : ['', `**Kit API:** ${spec.kitApi.map(it => `\`${it}\``).join(', ')}`])
            ],
            links: [
                tabSourceLink(`conversations/${spec.pageId}Demo.ts`),
                ...(spec.links ?? [KIT_LINKS.desktop, KIT_LINKS.core])
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Display',
                    info: 'How the chat renders. The conversation itself comes from the script.',
                    items: [
                        wrapperOption({
                            label: 'Assistant name',
                            propName: 'ChatMessageListProps.assistantName',
                            control: textInput({bind: 'assistantName', width: 120})
                        }),
                        wrapperOption({
                            label: 'Message headers',
                            propName: 'ChatMessageListProps.showMessageHeader',
                            control: switchInput({bind: 'showMessageHeader'})
                        }),
                        wrapperOption({
                            label: 'Compact density',
                            info: 'Adds `xh-chat--compact` to a parent of the chat.',
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
                    icon: Icon.reset(),
                    text: 'Clear conversation',
                    intent: 'danger',
                    disabled: chatModel.isEmpty,
                    onClick: () => chatModel.clear()
                })
            ],
            item: chatPanel({
                model: chatModel,
                className: classNames(
                    'tb-chatkit-demo',
                    compact && 'xh-chat--compact',
                    reducedMotion && 'xh-chat--reduced-motion'
                ),
                testId: `chatkit-${spec.pageId}`,
                flex: 1,
                title,
                icon,
                compactHeader: true,
                headerItems: [
                    chatClearButton({
                        chatModel,
                        tooltip: 'Clear the conversation, to run the demo again'
                    })
                ],
                emptyStateProps: {icon: null, title: spec.heading, text: spec.intro},
                suggestions: spec.suggestions,
                composerProps: {placeholder: spec.placeholder},
                messageListProps: {assistantName, showMessageHeader}
            })
        });
    }
});

/** A page component for a conversation demo, for the tab's content. */
export function chatDemoPanel(spec: ChatDemoSpec) {
    return hoistCmp.factory({
        displayName: `ChatDemo-${spec.pageId}`,
        model: creates(() => new ChatDemoModel(spec)),
        render: () => chatDemoPage()
    });
}
