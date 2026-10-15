import type {ChatCodec, ChatDecoder, ChatEvent, ChatRunRequest} from '@xh/hoist-chat-kit/transport';
import {noAnswerEvents} from '@xh/hoist-chat-kit/transport';
import type {PlainObject} from '@xh/hoist/core';
import {logDebug, throwIf} from '@xh/hoist/utils/js';
import {findLast} from 'lodash';
import type {GuideDocument, GuideRunOptions, GuideSource} from './GuideApi';
import {NO_ANSWER_PART_ID, toNoAnswerData, toSourceFields} from './GuideApi';

/** Configuration for a {@link GuideCodec}. */
export interface GuideCodecConfig {
    /**
     * The library's documents, read when an answer finds nothing, to name the documents its
     * question searched. Default none - the reply then shows only the count of a scope.
     */
    documents?: () => GuideDocument[];
}

/**
 * Codec for the guideline assistant's query stream - Server-Sent Events in a dialect of its own,
 * each `data` a JSON frame typed by its `type`. Pair it with an `SseChatTransport` on a
 * `historyMode: 'server'` chat. The backend owns the conversation, so each request carries only
 * the new question.
 *
 * Request - `{question, sessionId, documentIds, idempotencyKey}`:
 *  - `sessionId` is the chat's thread id. The browser mints it, and the backend creates the chat
 *    on its first question.
 *  - `documentIds` is the `scope` of the turn's run options, or empty to search every document.
 *  - `idempotencyKey` is the turn id, so a retry of a turn replays its answer rather than run it
 *    again. A regenerate or an edit asks for a new answer, so it sends a key of its own.
 *
 * Response frames, decoded to kit events:
 *  - `chunk {text}` - appends to the answer.
 *  - `reset {}` - clears the answer, with an `xh.chat.textReplace` of empty text. Chunks follow.
 *  - `final_summary {answer, sources, sourceType, queryId}` - replaces the answer with its
 *    authoritative text, adds a source per cited passage, records `queryId` as the answer's server
 *    id, and finishes the run. For `sourceType: 'none'` - nothing found - it clears the text and
 *    adds the kit's fixed "not found" reply in its place, naming the documents searched.
 *  - `error {message}` - fails the turn, with code `guide-error`.
 *  - `duplicate_in_progress {message, retryAfterSeconds}` - fails the turn, with code
 *    `duplicate-in-progress` and the wait the backend asks for before a retry.
 */
export class GuideCodec implements ChatCodec {
    constructor(config: GuideCodecConfig = {}) {
        this.getDocuments = config.documents ?? (() => []);
    }

    encodeRequest(request: ChatRunRequest): PlainObject {
        const {historyMode, newMessages, threadId, runOptions} = request,
            question = findLast(newMessages, it => it.isUser)?.text;
        throwIf(
            historyMode !== 'server',
            `GuideCodec serves server-mode chats only, but this chat's historyMode is '${historyMode}'.`
        );
        throwIf(!question, 'GuideCodec found no question to send.');

        return {
            question,
            sessionId: threadId,
            documentIds: (runOptions as GuideRunOptions)?.scope ?? [],
            idempotencyKey: getIdempotencyKey(request)
        };
    }

    createDecoder(request: ChatRunRequest): ChatDecoder {
        const {threadId, runId, runOptions} = request,
            scope = (runOptions as GuideRunOptions)?.scope ?? [];
        return (frame: PlainObject): ChatEvent[] => {
            switch (frame.type) {
                case 'chunk':
                    return [{type: 'TEXT_MESSAGE_CHUNK', messageId: ANSWER_ID, delta: frame.text}];
                case 'reset':
                    return [textReplace('')];
                case 'final_summary':
                    return [
                        ...this.answerEvents(frame, scope),
                        ...(frame.sources as GuideSource[]).map((source, idx): ChatEvent => ({
                            type: 'CUSTOM',
                            name: 'xh.chat.source',
                            value: toSourceFields(source, frame.queryId, idx)
                        })),
                        {
                            type: 'CUSTOM',
                            name: 'xh.chat.message',
                            value: {role: 'assistant', serverId: frame.queryId}
                        },
                        {
                            type: 'RUN_FINISHED',
                            threadId,
                            runId,
                            metadata: {
                                finishReason: 'stop',
                                sourceType: frame.sourceType,
                                duplicate: frame.duplicate ?? false
                            }
                        }
                    ];
                case 'error':
                    return [{type: 'RUN_ERROR', message: frame.message, code: 'guide-error'}];
                case 'duplicate_in_progress':
                    return [
                        {
                            type: 'RUN_ERROR',
                            message: frame.message,
                            code: 'duplicate-in-progress',
                            metadata: {retryAfterSeconds: frame.retryAfterSeconds}
                        }
                    ];
                default:
                    logDebug(['Skipped guide frame of unknown type', frame.type], this);
                    return [];
            }
        };
    }

    //------------------
    // Implementation
    //------------------
    private readonly getDocuments: () => GuideDocument[];

    /** The final answer's text - or, for an answer that found nothing, the fixed reply. */
    private answerEvents({answer, sourceType}: PlainObject, scope: string[]): ChatEvent[] {
        if (sourceType !== 'none') return [textReplace(answer)];
        const data = toNoAnswerData(scope, this.getDocuments());
        return [textReplace(''), ...noAnswerEvents(data, {id: NO_ANSWER_PART_ID})];
    }
}

//------------------
// Implementation
//------------------
/** Id of the answer's text part. The backend streams one answer per run. */
const ANSWER_ID = 'answer';
function textReplace(text: string): ChatEvent {
    return {type: 'CUSTOM', name: 'xh.chat.textReplace', value: {text}};
}

/**
 * The turn id, which a retry of the turn shares, so the backend replays the turn's answer. A
 * regenerate or an edit wants a new answer, so it adds the step's own id.
 */
function getIdempotencyKey({trigger, turnId, runId}: ChatRunRequest): string {
    return trigger === 'regenerate' || trigger === 'edit' ? `${turnId}:${runId}` : turnId;
}
