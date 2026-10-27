import type {ChatThreadPage, ChatThreadQuery, ChatThreadStore} from '@xh/hoist-chat-kit/threads';
import type {OtherChatBackend} from './OtherChatModel';

/**
 * The kit's thread store over the other library's backend: list, rename and delete. It has no
 * `loadMessagesAsync`, as each `OtherChatConversation` loads its thread's messages itself.
 */
export class OtherChatThreadStore implements ChatThreadStore {
    constructor(private readonly backend: OtherChatBackend) {}

    async listThreadsAsync({search}: ChatThreadQuery): Promise<ChatThreadPage> {
        return {threads: await this.backend.listAsync(search)};
    }

    renameThreadAsync(threadId: string, title: string): Promise<void> {
        return this.backend.renameAsync(threadId, title);
    }

    deleteThreadsAsync(threadIds: string[]): Promise<void> {
        return this.backend.deleteAsync(threadIds);
    }
}
