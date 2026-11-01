import {code, div, li, p, pre, span, strong, ul} from '@xh/hoist/cmp/layout';
import type {HoistProps} from '@xh/hoist/core';
import {hoistCmp, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import type {ReactElement} from 'react';
import {demoGallery, demoGalleryTile, demoPanel, demoSection} from '../../common/Demo';
import {wrapper} from '../../common/Wrapper';
import type {ChatKitGroup} from './ChatKitCatalog';
import {CHAT_KIT_GROUPS, CHAT_KIT_PAGES, chatKitPage, chatKitRoute} from './ChatKitCatalog';
import {KIT_LINKS, tabSourceLink} from './common/ChatDemo';

/**
 * The front page of the Chat Kit tab: what the kit is, how to install it, and a gallery of every
 * demo page by group.
 */
export const overviewPanel = hoistCmp.factory({
    displayName: 'ChatKitOverviewPanel',

    render() {
        const page = chatKitPage('overview');
        return wrapper({
            title: 'Hoist Chat Kit',
            icon: page.icon(),
            description: [
                '`@xh/hoist-chat-kit` is a companion library to Hoist React. It gives a Hoist app a',
                'complete chat with an LLM or an agent: the models, the transports that stream',
                'replies from a backend, generative UI built on Hoist components, a thread layer,',
                'and the desktop chat components.',
                '',
                'Its code follows Hoist conventions, so it reads and behaves like the rest of a',
                'Hoist app. Every page in this tab runs the real kit, as installed in Toolbox.'
            ],
            links: [
                KIT_LINKS.readme,
                KIT_LINKS.docsIndex,
                KIT_LINKS.architecture,
                tabSourceLink('OverviewPanel.ts'),
                {
                    url: 'https://github.com/xh/hoist-chat-kit',
                    text: 'xh/hoist-chat-kit on GitHub',
                    notes: 'Source, issues and the changelog.'
                },
                {
                    url: 'https://www.npmjs.com/package/@xh/hoist-chat-kit',
                    text: '@xh/hoist-chat-kit on npm',
                    notes: 'Published as TypeScript and SCSS source, like Hoist itself.'
                }
            ],
            item: demoPanel({
                className: 'tb-chatkit-overview',
                items: [
                    demoSection({
                        title: 'What you get',
                        item: ul({
                            className: 'tb-chatkit-overview__features',
                            items: FEATURES.map(({icon, title, text}) =>
                                li({
                                    key: title,
                                    className: 'tb-chatkit-overview__feature',
                                    items: [
                                        icon,
                                        div({
                                            className: 'tb-chatkit-overview__feature-text',
                                            items: [strong(title), text]
                                        })
                                    ]
                                })
                            )
                        })
                    }),
                    demoSection({
                        title: 'Add a chat to an app',
                        note: 'A ChatModel with a transport and a tool, rendered by chatPanel.',
                        items: [
                            p({
                                className: 'tb-chatkit-overview__lede',
                                items: [
                                    'Install with ',
                                    code('pnpm add @xh/hoist-chat-kit'),
                                    ', add the package to ',
                                    code('extraIncludePaths'),
                                    " in the app's Rsbuild config so the build transpiles it, then:"
                                ]
                            }),
                            pre({className: 'tb-chatkit-overview__code', item: QUICK_START})
                        ]
                    }),
                    ...CHAT_KIT_GROUPS.filter(it => it.key !== 'overview').map(group =>
                        demoSection({
                            key: group.key,
                            title: group.title,
                            note: group.info,
                            item: gallery({group: group.key})
                        })
                    )
                ]
            })
        });
    }
});

interface GalleryProps extends HoistProps {
    group: ChatKitGroup;
}

const gallery = hoistCmp.factory<GalleryProps>(({group}) =>
    demoGallery({
        minTileWidth: 260,
        items: CHAT_KIT_PAGES.filter(it => it.group === group).map(page =>
            demoGalleryTile({
                key: page.id,
                title: span(
                    span({className: 'tb-chatkit-overview__tile-icon', item: page.icon()}),
                    page.title
                ),
                description: page.description,
                showInstance: false,
                onClick: () => XH.navigate(chatKitRoute(page.id))
            })
        )
    })
);

const FEATURES: Array<{icon: ReactElement; title: string; text: string}> = [
    {
        icon: Icon.bolt(),
        title: 'Real token streaming',
        text: 'Replies render as they arrive, and Stop closes the connection so the server stops generating.'
    },
    {
        icon: Icon.gears(),
        title: 'A client-side tool loop',
        text: 'The model calls tools that run in the browser and act on the app: filter a grid, change a dashboard, open a view.'
    },
    {
        icon: Icon.shieldCheck(),
        title: 'Human in the loop',
        text: 'Tool calls can wait for the user to approve them, in words that suit each call, or to answer them.'
    },
    {
        icon: Icon.mixedChart(),
        title: 'Generative UI',
        text: "The model shows the app's own Hoist components inline: grids, charts, KPI tiles and cards, from a catalog the app controls."
    },
    {
        icon: Icon.fileText(),
        title: 'Rich message parts',
        text: 'Markdown text, reasoning, tool call cards, files, sources with inline citations, and app-defined data parts.'
    },
    {
        icon: Icon.history(),
        title: 'Conversation actions',
        text: 'Stop, retry, regenerate, edit a past message, rate a reply, and persist history and drafts.'
    },
    {
        icon: Icon.arrowRightArrowLeft(),
        title: 'Protocol-neutral',
        text: 'AG-UI events are the wire vocabulary. Codecs translate AG-UI, the Anthropic Messages API and OpenAI chat completions.'
    },
    {
        icon: Icon.server(),
        title: 'Built for hoist-core',
        text: "The default transport streams NDJSON from your own server, with Hoist's auth, tracing and error handling."
    }
];

const QUICK_START = `import {ChatModel} from '@xh/hoist-chat-kit/core';
import {chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {AnthropicCodec, HoistChatTransport} from '@xh/hoist-chat-kit/transport';

export class AssistantModel extends HoistModel {
    @managed readonly chatModel = new ChatModel({
        transport: new HoistChatTransport({
            url: 'chat/stream',
            codec: new AnthropicCodec({system: 'You are a helpful assistant in a Hoist app.'})
        }),
        tools: [
            {
                name: 'set_theme',
                description: 'Switch the app between its light and dark themes.',
                parameters: {
                    type: 'object',
                    properties: {dark: {type: 'boolean', description: 'True for the dark theme.'}},
                    required: ['dark']
                },
                displayName: 'Change theme',
                icon: Icon.sun(),
                execute: ({dark}) => {
                    XH.setTheme(dark ? 'dark' : 'light');
                    return \`The app now uses the \${dark ? 'dark' : 'light'} theme.\`;
                }
            }
        ]
    });
}

export const assistantPanel = hoistCmp.factory({
    model: uses(AssistantModel),
    render({model}) {
        return chatPanel({model: model.chatModel, title: 'Assistant', icon: Icon.ai(), flex: 1});
    }
});`;
