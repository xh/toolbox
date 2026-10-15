import type {
    ChatFeedback,
    ChatFeedbackSpec,
    ChatMessageSpec,
    ChatPart
} from '@xh/hoist-chat-kit/core';
import {CHAT_NO_ANSWER_DATA_TYPE} from '@xh/hoist-chat-kit/core';
import type {
    ChatMessagePage,
    ChatMessageQuery,
    ChatThreadPage,
    ChatThreadQuery,
    ChatThreadStore
} from '@xh/hoist-chat-kit/threads';
import {XH} from '@xh/hoist/core';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {throwIf} from '@xh/hoist/utils/js';
import type {GuideChatRecord, GuideDocument, GuideMessageRecord, GuideRunOptions} from './GuideApi';
import {NO_ANSWER_PART_ID, toNoAnswerData, toSourceFields} from './GuideApi';

/** Configuration for a {@link GuideThreadStore}. */
export interface GuideThreadStoreConfig {
    /**
     * The library's documents, read to name the documents searched by a question that found
     * nothing. Default none - the reply then shows only the count of a scope.
     */
    documents?: () => GuideDocument[];
}

/**
 * Thread store for the guideline assistant, over its REST endpoints. The browser mints each chat's
 * session id, and the backend creates the chat on its first question, so the store has no
 * `createThreadAsync`. The backend has no pins and no paging, so the store lists every chat, loads
 * every message, and searches titles itself.
 *
 * Each history record is one question and its answer. The store maps it to a user message and an
 * assistant message, keyed by the record's `queryId`. The answer keeps the id as its server id,
 * for feedback, with its rating and its cited passages as source parts. The question keeps the
 * documents it searched as its run options, so a retry or an edit searches them again. An answer
 * that found nothing - `sourceType: 'none'` - restores as the kit's fixed "not found" reply, as it
 * streamed.
 */
export class GuideThreadStore implements ChatThreadStore {
    constructor(config: GuideThreadStoreConfig = {}) {
        this.getDocuments = config.documents ?? (() => []);
    }

    async listThreadsAsync({search}: ChatThreadQuery): Promise<ChatThreadPage> {
        const {chats} = await XH.fetchJson({url: 'guide/chats'}),
            term = search?.toLowerCase();
        return {
            threads: (chats as GuideChatRecord[])
                .filter(it => !term || it.title.toLowerCase().includes(term))
                .map(it => ({
                    id: it.sessionId,
                    title: it.title,
                    lastActivityAt: it.lastActivityAt * SECONDS,
                    isRunning: it.isRunning
                }))
        };
    }

    /** Throws a `FetchException` with `httpStatus` 404 for a chat with no question yet. */
    async loadMessagesAsync({threadId}: ChatMessageQuery): Promise<ChatMessagePage> {
        const {messages} = await XH.fetchJson({url: `guide/chats/${encode(threadId)}/messages`});
        return {
            messages: (messages as GuideMessageRecord[]).flatMap(it => this.toMessageSpecs(it))
        };
    }

    async renameThreadAsync(threadId: string, title: string): Promise<void> {
        await XH.fetchService.patchJson({url: `guide/chats/${encode(threadId)}`, body: {title}});
    }

    /** Deletes each chat. A chat the backend does not have - a 404 - counts as deleted. */
    async deleteThreadsAsync(threadIds: string[]): Promise<void> {
        await Promise.all(
            threadIds.map(id =>
                XH.fetchService.deleteJson({url: `guide/chats/${encode(id)}`}).catchWhen(
                    e => (e as any).httpStatus === 404,
                    () => null
                )
            )
        );
    }

    async submitFeedbackAsync({serverId, rating, comment}: ChatFeedbackSpec): Promise<void> {
        throwIf(!serverId, 'This answer has no id from the server yet, so it cannot be rated.');
        await XH.fetchService.patchJson({
            url: `guide/messages/${encode(serverId)}`,
            body: {rating: rating ? RATINGS[rating] : null, comment: comment ?? null}
        });
    }

    //------------------
    // Implementation
    //------------------
    private readonly getDocuments: () => GuideDocument[];

    /** The user and assistant messages for one question and its answer. */
    private toMessageSpecs(record: GuideMessageRecord): ChatMessageSpec[] {
        const {queryId, question, answer, sources, sourceType, documentIds} = record,
            createdAt = record.createdAt * SECONDS,
            runOptions: GuideRunOptions = {scope: documentIds ?? []},
            feedback: ChatFeedback = record.feedback
                ? {
                      rating: record.feedback === 'up' ? 'positive' : 'negative',
                      comment: record.comment
                  }
                : null,
            answerPart: ChatPart =
                sourceType === 'none'
                    ? {
                          type: 'data',
                          id: NO_ANSWER_PART_ID,
                          dataType: CHAT_NO_ANSWER_DATA_TYPE,
                          data: toNoAnswerData(runOptions.scope, this.getDocuments())
                      }
                    : {type: 'text', id: 'answer', text: answer, state: 'done'};

        return [
            {
                id: `${queryId}-question`,
                role: 'user',
                content: question,
                createdAt,
                metadata: {runOptions}
            },
            {
                id: queryId,
                role: 'assistant',
                createdAt,
                parts: [
                    answerPart,
                    ...sources.map((source, idx) => ({
                        type: 'source' as const,
                        ...toSourceFields(source, queryId, idx)
                    }))
                ],
                metadata: {serverId: queryId, sourceType, ...(feedback ? {feedback} : {})}
            }
        ];
    }
}

//------------------
// Implementation
//------------------
const RATINGS = {positive: 'up', negative: 'down'} as const;

function encode(id: string): string {
    return encodeURIComponent(id);
}
