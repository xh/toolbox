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

/**
 * An answer's text without the markup the backend's model can leak. A `<thinking>` or
 * `<function_calls>` block goes with its content, closed or still streaming. A stray `<invoke>`,
 * `<parameter>`, `<reason>` or `<answer>` tag goes, and its text stays. The chat's
 * `textTransform` applies it as the answer streams, and the store applies it to history, which
 * the transform does not reach.
 *
 * @param text - the answer's text so far.
 * @param isStreaming - true while more text may arrive. A tag cut off at the end of the text,
 *      such as `<thin`, then goes too, so it does not flash before the rest of it arrives.
 */
export function stripLeakedTags(text: string, isStreaming: boolean = false): string {
    text = text.replace(LEAKED_BLOCKS, '').replace(LEAKED_TAGS, '');
    return isStreaming ? trimPartialTag(text) : text;
}

//------------------
// Implementation
//------------------
const TAG_NAMES = ['thinking', 'function_calls', 'invoke', 'parameter', 'reason', 'answer'],
    LEAKED_BLOCKS = /<(thinking|function_calls)(\s[^>]*)?>[\s\S]*?(<\/\1>|$)/g,
    LEAKED_TAGS = /<\/?(invoke|parameter|reason|answer)(\s[^>]*)?>/g,
    PARTIAL_TAG = /^<\/?([a-z_]*)(\s[^>]*)?$/;

/**
 * The text without a leaked tag cut off at its end: a `<` or `</` with part of a tag's name, or
 * with all of it and attributes still arriving. A `<` in prose, such as `DTI < 43%`, stays.
 */
function trimPartialTag(text: string): string {
    const idx = text.lastIndexOf('<'),
        match = idx >= 0 ? PARTIAL_TAG.exec(text.slice(idx)) : null;
    if (!match) return text;

    const [, name, attrs] = match,
        isTag = attrs ? TAG_NAMES.includes(name) : TAG_NAMES.some(it => it.startsWith(name));
    return isTag ? text.slice(0, idx) : text;
}
