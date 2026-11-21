import {Icon} from '@xh/hoist/icon';
import type {ReactElement} from 'react';

/** The groups of the Chat Kit tab's switcher, in order. */
export type ChatKitGroup = 'overview' | 'components' | 'conversations' | 'integrations';

export const CHAT_KIT_GROUPS: Array<{key: ChatKitGroup; title: string; info: string}> = [
    {key: 'overview', title: 'Overview', info: 'What the kit is, and where to start.'},
    {
        key: 'components',
        title: 'Components',
        info: 'Each desktop component with a playground of its curated props.'
    },
    {
        key: 'conversations',
        title: 'Conversations',
        info: 'Scripted conversations that show one feature of a reply each. No model or server needed.'
    },
    {
        key: 'integrations',
        title: 'Integrations',
        info: 'The kit wired into a backend: a thread store, and a live model behind the Toolbox server.'
    }
];

export interface ChatKitPage {
    /** Tab id, and the last segment of the page's route. */
    id: string;
    /** Tab and rail title. */
    title: string;
    group: ChatKitGroup;
    /** One line for the Overview tile. */
    description: string;
    /** Icon for the rail header and the Overview tile. */
    icon: () => ReactElement;
}

export const CHAT_KIT_ROUTE = 'default.chatkit';

/**
 * Every page in the Chat Kit tab, in switcher order - the single source of truth for the tab
 * definitions, the routes and the Overview gallery.
 */
export const CHAT_KIT_PAGES: ChatKitPage[] = [
    {
        id: 'overview',
        title: 'Overview',
        group: 'overview',
        description: 'What the kit provides, how to install it, and a map of these demos.',
        icon: () => Icon.ai()
    },

    // Components
    {
        id: 'chatPanel',
        title: 'ChatPanel',
        group: 'components',
        description: 'A complete chat in one Panel: list, status region and composer.',
        icon: () => Icon.comment()
    },
    {
        id: 'composer',
        title: 'ChatComposer',
        group: 'components',
        description: 'The input, its slots and pills, attachments, and Send and Stop.',
        icon: () => Icon.penToSquare()
    },
    {
        id: 'messageList',
        title: 'ChatMessageList',
        group: 'components',
        description:
            'The conversation, read-only over a transcript, with actions and header items.',
        icon: () => Icon.list()
    },
    {
        id: 'markdown',
        title: 'ChatMarkdown',
        group: 'components',
        description: 'The streaming markdown renderer, code blocks, tables and the image policy.',
        icon: () => Icon.fileText()
    },
    {
        id: 'sources',
        title: 'Sources & Citations',
        group: 'components',
        description: 'The sources list, citation markers, and how a click opens a source.',
        icon: () => Icon.bookmark()
    },
    {
        id: 'emptyState',
        title: 'Empty State',
        group: 'components',
        description: 'The welcome screen of a new chat, with its slots and suggestion cards.',
        icon: () => Icon.sparkles()
    },
    {
        id: 'feedback',
        title: 'Feedback',
        group: 'components',
        description: 'Thumbs and comment forms on a reply, with and without a ChatModel.',
        icon: () => Icon.thumbsUp()
    },
    {
        id: 'status',
        title: 'Status & Live Cues',
        group: 'components',
        description: "A reply's status, time taken, and the status region's next action.",
        icon: () => Icon.stopwatch()
    },
    {
        id: 'theming',
        title: 'Theming',
        group: 'components',
        description: 'The --xh-chat-* variables, compact density and reduced motion.',
        icon: () => Icon.magic()
    },

    // Conversations
    {
        id: 'richContent',
        title: 'Rich Content',
        group: 'conversations',
        description: 'A streamed reply with headings, a table, code and numbered citations.',
        icon: () => Icon.fileText()
    },
    {
        id: 'reasoning',
        title: 'Reasoning & Tools',
        group: 'conversations',
        description: 'Streamed thinking, then three tool calls the browser runs. One fails.',
        icon: () => Icon.gears()
    },
    {
        id: 'timeline',
        title: 'Agent Timeline',
        group: 'conversations',
        description: 'A plan, a batch of calls and a sub-agent, summed up in one block.',
        icon: () => Icon.treeList()
    },
    {
        id: 'approval',
        title: 'Approval',
        group: 'conversations',
        description: 'A tool call that waits for Allow or Deny, shown as an order ticket.',
        icon: () => Icon.shieldCheck()
    },
    {
        id: 'interrupts',
        title: 'Agent Questions',
        group: 'conversations',
        description: 'A server agent pauses to ask a question, fill a form, or approve a tool.',
        icon: () => Icon.questionCircle()
    },
    {
        id: 'attachments',
        title: 'Attachments',
        group: 'conversations',
        description: 'Files attached with the paperclip, dropped on the chat, or pasted.',
        icon: () => Icon.paperclip()
    },
    {
        id: 'errors',
        title: 'Errors & Stop',
        group: 'conversations',
        description: 'A reply that fails partway, with Try Again, then a long one to stop.',
        icon: () => Icon.warning()
    },
    {
        id: 'genUi',
        title: 'Generative UI',
        group: 'conversations',
        description: 'KPI tiles, a grid that fills as it streams, a chart and a card.',
        icon: () => Icon.mixedChart()
    },

    // Integrations
    {
        id: 'workspace',
        title: 'Threads & Workspace',
        group: 'integrations',
        description:
            'A full-page chat over a thread store: sidebar, search, rename and background turns.',
        icon: () => Icon.window()
    },
    {
        id: 'liveModel',
        title: 'Live Model',
        group: 'integrations',
        description: 'Claude, relayed by the Toolbox server, with tools that act on this app.',
        icon: () => Icon.bolt()
    }
];

/** The catalog entry for a page, by id. Throws for an unknown id, so a typo fails fast. */
export function chatKitPage(id: string): ChatKitPage {
    const ret = CHAT_KIT_PAGES.find(it => it.id === id);
    if (!ret) throw new Error(`Unknown Chat Kit page: ${id}`);
    return ret;
}

/** The route of a page, for `XH.navigate()`. */
export function chatKitRoute(id: string): string {
    return `${CHAT_KIT_ROUTE}.${chatKitPage(id).id}`;
}
