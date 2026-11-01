import type {ChatMessage, ChatModelConfig, ChatToolSpec} from '@xh/hoist-chat-kit/core';
import {ChatModel} from '@xh/hoist-chat-kit/core';
import type {ChatSuggestion} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {chatClearButton, chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {AnthropicCodec, HoistChatTransport} from '@xh/hoist-chat-kit/transport';
import {placeholder} from '@xh/hoist/cmp/layout';
import type {Intent} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, observableRef} from '@xh/hoist/mobx';
import {canUseLlm, LLM_NO_ACCESS_MSG} from '../../../../core/llmAccess';
import {wrapper, wrapperAction, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {CHAT_KIT_PAGES, chatKitPage, chatKitRoute} from '../ChatKitCatalog';
import {KIT_LINKS, tabSourceLink} from '../common/ChatDemo';
import {createCatalog} from '../conversations/catalog';

/**
 * A live conversation with Claude, relayed by the Toolbox server's `llm/stream` endpoint. The
 * model gets tools that act on Toolbox itself - the theme, navigation, a toast and app info - and
 * optionally the generative UI catalog, so it can answer with grids, charts, metrics and cards.
 */
class LiveModelPanelModel extends HoistModel {
    /** The chat. Recreated when an option that its config reads changes. */
    @managed @observableRef accessor chatModel: ChatModel;

    /** `ChatMessageListProps.assistantName`. */
    @bindable accessor assistantName = 'Claude';
    /** True to give the model the generative UI catalog. */
    @bindable accessor useCatalog = true;
    /** `ChatModelConfig.track` - record each finished turn with Hoist activity tracking. */
    @bindable accessor track = false;

    /** A Chat Kit page the model asked to open, opened when its reply finishes. */
    private pendingPageId: string = null;

    constructor() {
        super();
        this.chatModel = new ChatModel(this.createChatConfig());
        this.addReaction({
            track: () => [this.useCatalog, this.track],
            run: () => this.recreateChatModel()
        });
    }

    //------------------
    // Implementation
    //------------------
    @action
    private recreateChatModel() {
        const old = this.chatModel;
        this.pendingPageId = null;
        this.chatModel = new ChatModel(this.createChatConfig());
        XH.safeDestroy(old);
    }

    private createChatConfig(): ChatModelConfig {
        const catalog = this.useCatalog ? createCatalog() : null,
            system = catalog ? `${SYSTEM_PROMPT}\n\n${catalog.instructions}` : SYSTEM_PROMPT;

        return {
            // These three lines connect the chat to the Toolbox server, which relays Claude.
            transport: new HoistChatTransport({
                url: 'llm/stream',
                codec: new AnthropicCodec({system, cacheControl: true})
            }),
            tools: [SET_THEME, this.createNavigateTool(), SHOW_TOAST, GET_APP_INFO],
            catalog,
            // Each step is a model call, and counts toward the server's per-user `llmRateLimit`.
            maxSteps: 6,
            track: this.track ? {category: 'ChatKit'} : false,
            onTurnComplete: msg => this.onTurnComplete(msg)
        };
    }

    /**
     * A tool to open another Chat Kit page. Leaving the page mid-turn would hide the rest of the
     * reply, so the page opens once the reply finishes.
     */
    private createNavigateTool(): ChatToolSpec {
        return {
            name: 'navigate',
            displayName: 'Open page',
            description:
                'Open a page of the Chat Kit tab in Toolbox. The page opens when your reply ' +
                'finishes, so say where you are taking the user first.',
            icon: Icon.arrowRight(),
            parameters: {
                type: 'object',
                properties: {
                    pageId: {
                        type: 'string',
                        enum: NAV_PAGES.map(it => it.id),
                        description: NAV_PAGES.map(it => `${it.id}: ${it.title}`).join('; ')
                    }
                },
                required: ['pageId']
            },
            summary: ({input}) => (input?.pageId ? pageTitle(input.pageId) : null),
            execute: ({pageId}) => {
                const page = chatKitPage(pageId);
                this.pendingPageId = page.id;
                return {status: 'Opens when this reply finishes.', page: page.title};
            }
        };
    }

    private onTurnComplete(message: ChatMessage) {
        const {pendingPageId} = this;
        this.pendingPageId = null;
        if (pendingPageId && message.status === 'complete') {
            XH.navigate(chatKitRoute(pendingPageId));
        }
    }
}

export const liveModelPanel = hoistCmp.factory({
    displayName: 'LiveModelPanel',
    model: creates(LiveModelPanelModel),

    render({model}) {
        const page = chatKitPage('liveModel'),
            title = page.title,
            icon = page.icon(),
            hasAccess = canUseLlm(),
            {chatModel, assistantName} = model;

        return wrapper({
            title,
            icon,
            description: DESCRIPTION,
            links: [
                KIT_LINKS.transport,
                KIT_LINKS.core,
                tabSourceLink('integrations/LiveModelPanel.ts'),
                {
                    url: '$TB/grails-app/services/io/xh/toolbox/llm/LlmService.groovy',
                    notes: 'The server relay: access, request policy, limits and tracking.'
                }
            ],
            options: hasAccess
                ? [
                      wrapperOptionGroup({
                          label: 'Chat',
                          items: [
                              wrapperOption({
                                  label: 'Assistant name',
                                  propName: 'ChatMessageListProps.assistantName',
                                  control: textInput({bind: 'assistantName', width: 120})
                              }),
                              wrapperOption({
                                  label: 'Generative UI catalog',
                                  propName: 'ChatModelConfig.catalog',
                                  info: 'Gives the model the grid, chart, metrics and card. Starts a new chat.',
                                  control: switchInput({bind: 'useCatalog'})
                              }),
                              wrapperOption({
                                  label: 'Track turns',
                                  propName: 'ChatModelConfig.track',
                                  info: 'Records each turn in the Admin Console Activity tab. Starts a new chat.',
                                  control: switchInput({bind: 'track'})
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
                  ]
                : null,
            item: hasAccess
                ? chatPanel({
                      model: chatModel,
                      className: 'tb-chatkit-demo',
                      testId: 'chatkit-liveModel',
                      flex: 1,
                      title,
                      icon,
                      compactHeader: true,
                      headerItems: [chatClearButton({chatModel})],
                      emptyStateProps: EMPTY_STATE,
                      suggestions: SUGGESTIONS,
                      composerProps: {
                          placeholder: 'Ask Claude to change the theme, open a demo...'
                      },
                      messageListProps: {assistantName}
                  })
                : placeholder(Icon.lock(), LLM_NO_ACCESS_MSG)
        });
    }
});

//------------------
// Implementation
//------------------
const DESCRIPTION = [
    'A real conversation with Claude. The Toolbox server relays each model call to the Anthropic',
    'API, so the API key never reaches the browser. The chat posts to it with `HoistChatTransport`',
    'and encodes requests with `AnthropicCodec`:',
    '',
    '```ts',
    'transport: new HoistChatTransport({',
    "  url: 'llm/stream',",
    '  codec: new AnthropicCodec({system})',
    '})',
    '```',
    '',
    'The model has tools that act on this app: it can switch the theme, open another demo, show a',
    'toast once you approve it, and read the app version and current user. It has no live data,',
    'so it answers with sample figures.',
    '',
    'Access needs the `TOOLBOX_LLM_USER` role, unless the `llmOpenToAllUsers` config is on. The',
    'server limits each user to `llmRateLimit` model calls an hour, and a tool loop makes one call',
    'per step. The server needs an Anthropic key in the `llmApiKey` config.'
];

const EMPTY_STATE = {
    icon: null,
    title: 'Talk to a live model',
    text:
        'Claude can change this app as well as answer: switch the theme, open a demo, or show ' +
        'a toast once you approve it. Ask for data and it answers with sample figures.'
};

const SUGGESTIONS: ChatSuggestion[] = [
    {text: 'Switch to the dark theme', icon: Icon.moon()},
    {text: 'Take me to the Agent Timeline demo', icon: Icon.arrowRight()},
    {text: 'Show a sample equity portfolio as a grid', icon: Icon.gridPanel()},
    {text: 'Toast a hello to the team', icon: Icon.bullhorn()}
];

/** Pages the `navigate` tool may open - all but this one. */
const NAV_PAGES = CHAT_KIT_PAGES.filter(it => it.id !== 'liveModel');

const SYSTEM_PROMPT = [
    'You are the assistant on the Live Model page of the Chat Kit tab in Toolbox, the demo app',
    'for the Hoist framework by Extremely Heavy Industries (XH). Hoist Chat Kit is the library',
    'that draws this chat.',
    '',
    'Your tools act on Toolbox itself:',
    '- set_theme switches the app between the light and dark themes.',
    '- navigate opens another page of the Chat Kit tab. The page opens when your reply finishes.',
    '- show_toast shows a short message in a toast. The user approves each toast first.',
    '- get_app_info returns the app name, version, environment and the current user.',
    'Use a tool when the user asks for what it does. Do not call a tool just to show it off.',
    '',
    'You have no access to live or private data. When asked about portfolios, companies or',
    'markets, answer with realistic sample figures, and say once, briefly, that they are sample',
    'data. Keep replies short.'
].join('\n');

const SET_THEME: ChatToolSpec = {
    name: 'set_theme',
    displayName: 'Set theme',
    description: 'Switch the Toolbox theme to light or dark, or toggle it.',
    icon: Icon.sun(),
    parameters: {
        type: 'object',
        properties: {theme: {type: 'string', enum: ['light', 'dark', 'toggle']}},
        required: ['theme']
    },
    summary: ({input}) => input?.theme ?? null,
    execute: ({theme}) => {
        if (theme === 'toggle') {
            XH.toggleTheme();
        } else {
            XH.setTheme(theme);
        }
        return {theme: XH.darkTheme ? 'dark' : 'light'};
    }
};

const SHOW_TOAST: ChatToolSpec = {
    name: 'show_toast',
    displayName: 'Show toast',
    description: 'Show a short message to the user in a toast. The user approves it first.',
    icon: Icon.bullhorn(),
    parameters: {
        type: 'object',
        properties: {
            message: {type: 'string', description: 'The message - one short sentence.'},
            intent: {type: 'string', enum: ['primary', 'success', 'warning', 'danger']}
        },
        required: ['message']
    },
    needsApproval: true,
    approvalPrompt: ({message}) => `Show a toast that says "${message}"?`,
    summary: ({input}) => input?.message ?? null,
    execute: ({message, intent}) => {
        XH.toast({message, intent: (intent ?? 'primary') as Intent});
        return {shown: true};
    }
};

const GET_APP_INFO: ChatToolSpec = {
    name: 'get_app_info',
    displayName: 'Get app info',
    description: 'Get the app name, version and environment, the current user and the theme.',
    icon: Icon.info(),
    parameters: {type: 'object', properties: {}},
    execute: () => {
        const env = XH.environmentService,
            user = XH.getUser();
        return {
            appName: XH.appName,
            appVersion: XH.appVersion,
            environment: env.appEnvironment,
            hoistReactVersion: env.get('hoistReactVersion'),
            hoistCoreVersion: env.get('hoistCoreVersion'),
            user: {username: user.username, displayName: user.displayName},
            theme: XH.darkTheme ? 'dark' : 'light'
        };
    }
};

function pageTitle(id: string): string {
    return CHAT_KIT_PAGES.find(it => it.id === id)?.title ?? id;
}
