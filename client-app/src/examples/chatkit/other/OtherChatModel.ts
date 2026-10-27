import type {ChatThreadSummary} from '@xh/hoist-chat-kit/threads';
import {HoistModel, XH} from '@xh/hoist/core';
import {action, computed, observable, observableRef} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {find, findLast, omit, without} from 'lodash';

/** A message in the other library's own format. */
export interface OtherChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    status: 'streaming' | 'done' | 'failed' | 'stopped';
}

/** A thread as the other library's backend stores it. */
interface OtherChatThread {
    id: string;
    title: string;
    createdAt: number;
    lastActivityAt: number;
    messages: OtherChatMessage[];
}

/**
 * Stands in for a chat library that the kit does not run, such as OpenUI, together with the app's
 * own model over it. It keeps its own threads on an emulated backend, holds the messages of the
 * threads it has open, and streams its own replies - one turn per thread, which runs on while the
 * user reads another thread. Nothing here uses the kit's chat engine: the kit sees this model only
 * through `OtherChatConversation` and `OtherChatThreadStore`.
 *
 * Type "fail" in a question for a reply that fails partway, and "slow" for one slow enough to
 * switch threads while it runs.
 */
export class OtherChatModel extends HoistModel {
    /** Id of the thread the view shows, or null. (observable) */
    @observable accessor shownThreadId: string = null;

    /** Messages of the threads open here, by thread id. (observable) */
    @observableRef accessor openMessages: Record<string, OtherChatMessage[]> = {};

    /** Ids of the threads with a reply streaming. (observable) */
    @observableRef accessor runningThreadIds: string[] = [];

    /** Ids of the new threads the backend has created here, on their first question. */
    @observableRef accessor savedThreadIds: string[] = [];

    /** Why the last reply of a thread failed, by thread id. (observable) */
    @observableRef accessor failedThreads: Record<string, string> = {};

    /** The shown thread's messages. */
    @computed
    get messages(): OtherChatMessage[] {
        return this.openMessages[this.shownThreadId] ?? [];
    }

    /** True while the shown thread's reply streams. */
    @computed
    get isShownRunning(): boolean {
        return this.runningThreadIds.includes(this.shownThreadId);
    }

    /** Start a thread under an id the app gives it. The backend creates it on its first question. */
    @action
    startThread(threadId: string) {
        this.openMessages = {...this.openMessages, [threadId]: []};
    }

    /** Load a thread's messages from the backend. Rejects with `httpStatus` 404 if it is missing. */
    async openThreadAsync(threadId: string): Promise<void> {
        const messages = await this.backend.getMessagesAsync(threadId);
        // A turn may have started in this thread while the load ran - it holds the latest.
        if (!this.runningThreadIds.includes(threadId)) this.setMessages(threadId, messages);
    }

    /** Show a thread in the view. */
    @action
    showThread(threadId: string) {
        this.shownThreadId = threadId;
    }

    /** Drop a closed thread's messages. */
    @action
    closeThread(threadId: string) {
        this.openMessages = omit(this.openMessages, threadId);
    }

    /** Ask a question in the shown thread, and stream the reply. */
    async sendAsync(text: string) {
        const threadId = this.shownThreadId;
        text = text?.trim();
        if (!threadId || !text || this.runningThreadIds.includes(threadId)) return;

        const reply: OtherChatMessage = {
            id: XH.genId(),
            role: 'assistant',
            text: '',
            status: 'streaming'
        };
        this.addMessages(threadId, [{id: XH.genId(), role: 'user', text, status: 'done'}, reply]);
        this.setRunning(threadId, true);

        try {
            if (!this.backend.has(threadId)) {
                await this.backend.createAsync(threadId, text);
                this.markSaved(threadId);
            }
            await this.streamReplyAsync(threadId, reply.id, text);
        } finally {
            // Save before the turn ends: the kit closes the thread's conversation as soon as it
            // stops being busy, if the user is reading another thread.
            await this.backend.saveMessagesAsync(threadId, this.openMessages[threadId] ?? []);
            this.setRunning(threadId, false);
        }
    }

    /** Stop a thread's streaming reply. */
    stopThread(threadId: string) {
        if (this.runningThreadIds.includes(threadId)) this.stopped.add(threadId);
    }

    //------------------
    // Backend, for the thread store
    //------------------
    readonly backend = new OtherChatBackend();

    //------------------
    // Implementation
    //------------------
    private readonly stopped = new Set<string>();

    private async streamReplyAsync(threadId: string, replyId: string, question: string) {
        const isSlow = /slow/i.test(question),
            failsAt = /fail/i.test(question) ? 12 : -1,
            words = replyText(question).split(' ');

        for (let i = 0; i < words.length; i++) {
            await wait(isSlow ? 250 : 45);
            if (this.stopped.delete(threadId)) {
                this.updateReply(threadId, replyId, {status: 'stopped'});
                return;
            }
            if (i === failsAt) {
                this.updateReply(threadId, replyId, {status: 'failed'});
                this.setFailed(threadId, 'The other library lost its connection.');
                return;
            }
            const reply = find(this.openMessages[threadId], {id: replyId});
            this.updateReply(threadId, replyId, {
                text: `${reply?.text ?? ''}${i ? ' ' : ''}${words[i]}`
            });
        }
        this.updateReply(threadId, replyId, {status: 'done'});
    }

    @action
    private setMessages(threadId: string, messages: OtherChatMessage[]) {
        this.openMessages = {...this.openMessages, [threadId]: messages};
    }

    @action
    private addMessages(threadId: string, messages: OtherChatMessage[]) {
        this.openMessages = {
            ...this.openMessages,
            [threadId]: [...(this.openMessages[threadId] ?? []), ...messages]
        };
        this.failedThreads = omit(this.failedThreads, threadId);
    }

    @action
    private updateReply(threadId: string, replyId: string, changes: Partial<OtherChatMessage>) {
        const messages = this.openMessages[threadId];
        if (!messages) return;
        this.openMessages = {
            ...this.openMessages,
            [threadId]: messages.map(it => (it.id === replyId ? {...it, ...changes} : it))
        };
    }

    @action
    private setRunning(threadId: string, isRunning: boolean) {
        this.runningThreadIds = isRunning
            ? [...this.runningThreadIds, threadId]
            : without(this.runningThreadIds, threadId);
    }

    @action
    private markSaved(threadId: string) {
        this.savedThreadIds = [...this.savedThreadIds, threadId];
    }

    @action
    private setFailed(threadId: string, reason: string) {
        this.failedThreads = {...this.failedThreads, [threadId]: reason};
    }
}

/**
 * The other library's backend, in memory, with network latency. It creates a thread on its first
 * question, under the id the browser gave it.
 */
export class OtherChatBackend {
    private threads: OtherChatThread[] = SEED_THREADS.map(it => ({...it}));

    has(threadId: string): boolean {
        return !!find(this.threads, {id: threadId});
    }

    async listAsync(search: string): Promise<ChatThreadSummary[]> {
        await wait(LATENCY_MS);
        const query = search?.toLowerCase();
        return this.threads
            .filter(it => !query || it.title.toLowerCase().includes(query))
            .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
            .map(({id, title, createdAt, lastActivityAt}) => ({
                id,
                title,
                createdAt,
                lastActivityAt
            }));
    }

    async getMessagesAsync(threadId: string): Promise<OtherChatMessage[]> {
        await wait(LATENCY_MS);
        const thread = find(this.threads, {id: threadId});
        if (!thread) throw Object.assign(new Error('Thread not found.'), {httpStatus: 404});
        return thread.messages.map(it => ({...it}));
    }

    async createAsync(threadId: string, question: string) {
        await wait(LATENCY_MS);
        const now = Date.now();
        this.threads.push({
            id: threadId,
            title: question.slice(0, 60),
            createdAt: now,
            lastActivityAt: now,
            messages: []
        });
    }

    async saveMessagesAsync(threadId: string, messages: OtherChatMessage[]) {
        const thread = find(this.threads, {id: threadId});
        if (!thread) return;
        thread.messages = messages.map(it => ({...it}));
        thread.lastActivityAt = Date.now();
        // The backend titles a thread from its last question.
        thread.title = findLast(messages, {role: 'user'})?.text.slice(0, 60) ?? thread.title;
    }

    async renameAsync(threadId: string, title: string) {
        await wait(LATENCY_MS);
        const thread = find(this.threads, {id: threadId});
        if (thread) thread.title = title;
    }

    async deleteAsync(threadIds: string[]) {
        await wait(LATENCY_MS);
        this.threads = this.threads.filter(it => !threadIds.includes(it.id));
    }
}

//------------------
// Implementation
//------------------
const LATENCY_MS = 300;

const HOUR = 60 * 60 * 1000;

const SEED_THREADS: OtherChatThread[] = [
    {
        id: 'other-1',
        title: 'Quarterly rates outlook',
        createdAt: Date.now() - 2 * HOUR,
        lastActivityAt: Date.now() - HOUR,
        messages: [
            {id: 'm1', role: 'user', text: 'Quarterly rates outlook', status: 'done'},
            {
                id: 'm2',
                role: 'assistant',
                text: 'The other library answered this earlier. Its messages load from its own backend.',
                status: 'done'
            }
        ]
    },
    {
        id: 'other-2',
        title: 'Desk coverage over the holidays',
        createdAt: Date.now() - 30 * HOUR,
        lastActivityAt: Date.now() - 26 * HOUR,
        messages: [
            {id: 'm3', role: 'user', text: 'Desk coverage over the holidays', status: 'done'},
            {
                id: 'm4',
                role: 'assistant',
                text: 'A reply from yesterday, stored by the other library.',
                status: 'done'
            }
        ]
    }
];

function replyText(question: string): string {
    return (
        `This reply comes from the other library, not the kit's chat engine. You asked: "${question}". ` +
        'The thread list beside it belongs to the kit, which drives this chat through a ' +
        'ChatConversation adapter. ' +
        'Switch threads while this streams to see it keep running in the list, then come back.'
    );
}
