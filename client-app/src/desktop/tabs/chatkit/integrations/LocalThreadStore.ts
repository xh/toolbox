import type {ChatFeedbackSpec, ChatMessageSpec} from '@xh/hoist-chat-kit/core';
import {ChatMessage} from '@xh/hoist-chat-kit/core';
import type {
    ChatMessagePage,
    ChatMessageQuery,
    ChatThreadPage,
    ChatThreadQuery,
    ChatThreadStore,
    ChatThreadSummary
} from '@xh/hoist-chat-kit/threads';
import {XH} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {cloneDeep, find, omit, orderBy, remove, truncate} from 'lodash';

/** A thread held by a {@link LocalThreadStore}: its summary and its messages, oldest first. */
export interface LocalThread extends Partial<ChatThreadSummary> {
    id: string;
    messages?: ChatMessageSpec[];
}

export interface LocalThreadStoreConfig {
    /** Key in `XH.localStorageService` that holds the threads, so they survive a reload. */
    storageKey: string;

    /** The threads to start with, and to return to on {@link LocalThreadStore.reset}. */
    seed: () => LocalThread[];

    /** Latency of each call, in milliseconds, as a backend would have. Default 250. */
    delayMs?: number;
}

/**
 * A `ChatThreadStore` that keeps its threads in the browser, so the workspace demo needs no
 * server. It answers as a backend would: threads most recently active first, a search by title,
 * a missing thread as a 404, and a delete of a missing thread as a success.
 *
 * The store does not see the chat's runs. The page records each finished turn with
 * {@link saveThread}, from the chat's `onTurnComplete` and `onTurnPause`, as a backend would
 * store a run. Modeled on the `LocalChatThreadStore` fixture in the kit's own tests.
 */
export class LocalThreadStore implements ChatThreadStore {
    readonly storageKey: string;
    readonly delayMs: number;

    constructor({storageKey, seed, delayMs = 250}: LocalThreadStoreConfig) {
        this.storageKey = storageKey;
        this.seed = seed;
        this.delayMs = delayMs;
        this.threads = this.read() ?? seed();
    }

    //------------------------
    // ChatThreadStore
    //------------------------
    async listThreadsAsync({search}: ChatThreadQuery): Promise<ChatThreadPage> {
        await wait(this.delayMs);
        const term = search?.toLowerCase(),
            matches = this.threads.filter(it => !term || it.title.toLowerCase().includes(term));
        return {
            threads: orderBy(matches, 'lastActivityAt', 'desc').map(
                it => omit(cloneDeep(it), 'messages') as ChatThreadSummary
            )
        };
    }

    async loadMessagesAsync({threadId}: ChatMessageQuery): Promise<ChatMessagePage> {
        await wait(this.delayMs);
        return {messages: cloneDeep(this.getOrThrow(threadId).messages ?? [])};
    }

    async renameThreadAsync(threadId: string, title: string): Promise<void> {
        await wait(this.delayMs);
        this.getOrThrow(threadId).title = title;
        this.write();
    }

    async deleteThreadsAsync(threadIds: string[]): Promise<void> {
        threadIds.forEach(id => this.deletedIds.add(id));
        await wait(this.delayMs);
        remove(this.threads, it => threadIds.includes(it.id));
        this.write();
    }

    async submitFeedbackAsync({threadId, messageId, rating, comment}: ChatFeedbackSpec) {
        await wait(this.delayMs);
        const message = find(this.getOrThrow(threadId).messages, {id: messageId});
        if (!message) throw notFound(`Message '${messageId}'`);

        const metadata = omit(message.metadata, 'feedback');
        message.metadata = rating
            ? {...metadata, feedback: comment ? {rating, comment} : {rating}}
            : metadata;
        this.write();
    }

    //------------------------
    // Backend state
    //------------------------
    /**
     * Add a thread, or update one, as the backend would on a run. Fields left out keep their
     * values. A new thread with no title takes one from its first question, and
     * `lastActivityAt` defaults to now. A thread deleted in this session stays deleted, so that
     * a turn the delete stopped cannot bring it back.
     */
    saveThread(thread: LocalThread) {
        if (this.deletedIds.has(thread.id)) return;

        const now = Date.now(),
            existing = find(this.threads, {id: thread.id}),
            saved: LocalThread = {
                createdAt: now,
                messages: [],
                ...existing,
                lastActivityAt: now,
                ...cloneDeep(thread)
            };
        saved.title ??= titleFor(saved.messages);

        remove(this.threads, it => it.id === thread.id);
        this.threads.push(saved);
        this.write();
    }

    /** Throw away every change, and start again from the seed threads. */
    reset() {
        this.threads = this.seed();
        this.deletedIds.clear();
        this.write();
    }

    //------------------
    // Implementation
    //------------------
    private readonly seed: () => LocalThread[];
    private readonly deletedIds = new Set<string>();
    private threads: LocalThread[];

    private getOrThrow(threadId: string): LocalThread {
        const ret = find(this.threads, {id: threadId});
        if (!ret) throw notFound(`Thread '${threadId}'`);
        return ret;
    }

    private read(): LocalThread[] {
        try {
            return XH.localStorageService.get(this.storageKey, null);
        } catch (e) {
            XH.handleException(e, {showAlert: false});
            return null;
        }
    }

    private write() {
        try {
            XH.localStorageService.set(this.storageKey, this.threads);
        } catch (e) {
            XH.handleException(e, {showAlert: false});
        }
    }
}

/** A title from a thread's first question, as a backend might name a new thread. */
function titleFor(messages: ChatMessageSpec[]): string {
    const question = find(messages, {role: 'user'}),
        text = question ? new ChatMessage(question).text.trim() : '';
    return text ? truncate(text, {length: 48, separator: ' '}) : 'New chat';
}

/** An error that reports a missing record as a 404, as Hoist's `FetchService` does. */
function notFound(what: string): Error {
    return Object.assign(new Error(`${what} not found.`), {httpStatus: 404});
}
