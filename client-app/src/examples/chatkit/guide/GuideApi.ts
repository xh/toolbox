import type {ChatNoAnswerData, ChatSourcePart} from '@xh/hoist-chat-kit/core';
import {isEmpty} from 'lodash';

/**
 * The guideline assistant's wire format, as served by the Toolbox `guide/*` endpoints (see
 * `GuideService.groovy`), and the mapping from its cited passages to the kit's source parts.
 */

/** A cited passage, as `final_summary` and the message history carry it. */
export interface GuideSource {
    documentId: string;
    friendlyName: string;

    /** The cited text, up to 300 characters. */
    excerpt: string;

    /** The `n` of the `[n]` that cites the passage in the answer, or null. */
    marker: number;
}

/** `library` for an answer from the documents, `none` for one with no sources. */
export type GuideSourceType = 'library' | 'none';

/** A chat, as `GET guide/chats` lists it. */
export interface GuideChatRecord {
    sessionId: string;
    title: string;

    /** Epoch seconds. */
    lastActivityAt: number;

    /** True while a query in the chat is running on the server. */
    isRunning: boolean;
}

/** One question and its answer, as `GET guide/chats/{sessionId}/messages` returns it. */
export interface GuideMessageRecord {
    /** The answer's id - the key for feedback. */
    queryId: string;
    question: string;
    answer: string;
    sources: GuideSource[];
    sourceType: GuideSourceType;

    /** The documents the question searched, or empty for the whole library. */
    documentIds: string[];

    /** Epoch seconds. */
    createdAt: number;

    /** The user's rating, if any. */
    feedback?: 'up' | 'down';
    comment?: string;
}

/** A document in the library, as `GET guide/documents` lists it. */
export interface GuideDocument {
    documentId: string;
    documentName: string;
    passageCount: number;
}

/** A document with its passages, as `GET guide/documents/{documentId}` returns it. */
export interface GuideDocumentDetail {
    documentId: string;
    documentName: string;

    /** The passages, in document order. A source's excerpt is the start of one of them. */
    passages: GuidePassage[];
}

/** A passage of a document - the unit that retrieval cites. */
export interface GuidePassage {
    /** Unique in the library. */
    id: string;
    text: string;
}

/** Run options for a guide chat - see `ChatModel.runOptions`. */
export interface GuideRunOptions {
    /** Ids of the documents the next question searches, or empty for the whole library. */
    scope: string[];
}

/**
 * The kit source for a cited passage. The codec sends it in an `xh.chat.source` event, and the
 * store restores it from history, so a reloaded answer matches the one that streamed.
 *
 * @param source - the passage.
 * @param queryId - id of the answer that cites it.
 * @param index - position of the passage in the answer's sources.
 */
export function toSourceFields(
    source: GuideSource,
    queryId: string,
    index: number
): Omit<ChatSourcePart, 'type'> {
    return {
        id: `${queryId}-source-${index + 1}`,
        sourceType: 'document',
        title: source.friendlyName,
        marker: source.marker,
        metadata: {documentId: source.documentId, excerpt: source.excerpt}
    };
}

/** Id of the kit's fixed "not found" part, in an answer with `sourceType: 'none'`. */
export const NO_ANSWER_PART_ID = 'no-answer';

/**
 * The data of the kit's fixed "not found" reply, for an answer with `sourceType: 'none'`: the
 * documents the question searched, by name. The codec sends it in an `xh.chat.data` event, and
 * the store restores it from history.
 *
 * @param documentIds - the question's scope, or empty for the whole library.
 * @param documents - the library, or empty if not yet loaded. Then only the count of a scope shows.
 */
export function toNoAnswerData(
    documentIds: string[],
    documents: GuideDocument[]
): ChatNoAnswerData {
    const searched = isEmpty(documentIds)
        ? documents
        : documents.filter(it => documentIds.includes(it.documentId));
    if (!isEmpty(searched)) {
        return {documents: searched.map(it => ({id: it.documentId, name: it.documentName}))};
    }
    return isEmpty(documentIds) ? {} : {documentCount: documentIds.length};
}
