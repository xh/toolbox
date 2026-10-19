import type {ChatModelConfig} from '@xh/hoist-chat-kit/core';
import type {ChatSuggestion} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import type {ReactElement} from 'react';

/** One demo conversation in the Chat Kit app, listed in its left-hand nav. */
export interface ChatKitDemo {
    /** Unique id, also used to restore the last demo shown. */
    id: string;

    /** Title, for the nav and the chat panel. */
    title: string;

    /** One line on what the demo shows, for the nav. */
    description: string;

    icon: ReactElement;

    /** Heading for the empty conversation - what to try. */
    heading: string;

    /** Supporting text for the empty conversation - what to try and what to watch for. */
    intro: string;

    /** Prompts offered in the empty conversation. Any message gets the demo's reply. */
    suggestions: ChatSuggestion[];

    /** Placeholder for the composer. */
    placeholder?: string;

    /** True for a demo that calls a model through the server, which needs LLM access. */
    requiresLlm?: boolean;

    /** Creates the config for the demo's ChatModel - its transport, tools and composer. */
    createChatConfig: () => ChatModelConfig;
}
