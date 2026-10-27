import type {
    ChatConversation,
    ChatConversationSpec,
    ChatThreadEndedEarly
} from '@xh/hoist-chat-kit/threads';
import {HoistBase} from '@xh/hoist/core';
import {findLast} from 'lodash';
import type {OtherChatModel} from './OtherChatModel';

/**
 * One thread of the other library, as the kit's threads model sees it. The threads model opens
 * one for the selected thread, and keeps it open while its reply streams. Each member reads the
 * other library's state for this thread, so the kit's list shows its turns as they run, finish
 * away or fail.
 */
export class OtherChatConversation extends HoistBase implements ChatConversation {
    readonly threadId: string;

    get isBusy(): boolean {
        return this.chat.runningThreadIds.includes(this.threadId);
    }

    get isSaved(): boolean {
        return !this.isNew || this.chat.savedThreadIds.includes(this.threadId);
    }

    get endedEarly(): ChatThreadEndedEarly {
        const reason = this.chat.failedThreads[this.threadId];
        return reason ? {runEnd: 'failed', reason} : null;
    }

    get title(): string {
        const messages = this.chat.openMessages[this.threadId];
        return findLast(messages, {role: 'user'})?.text ?? null;
    }

    constructor(chat: OtherChatModel, {threadId, isNew}: ChatConversationSpec) {
        super();
        this.chat = chat;
        this.threadId = threadId;
        this.isNew = isNew;
        if (isNew) chat.startThread(threadId);
    }

    loadAsync(): Promise<void> {
        return this.chat.openThreadAsync(this.threadId);
    }

    stop() {
        this.chat.stopThread(this.threadId);
    }

    override destroy() {
        this.chat.closeThread(this.threadId);
        super.destroy();
    }

    //------------------
    // Implementation
    //------------------
    private readonly chat: OtherChatModel;
    private readonly isNew: boolean;
}
