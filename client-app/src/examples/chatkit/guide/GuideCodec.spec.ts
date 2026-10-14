import type {ChatRunError} from '@xh/hoist-chat-kit/core';
import {ChatMessage, ChatModel} from '@xh/hoist-chat-kit/core';
import type {ChatRunRequest, ChatRunTrigger} from '@xh/hoist-chat-kit/transport';
import {SseChatTransport} from '@xh/hoist-chat-kit/transport';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {beforeAll, describe, expect, it, onTestFinished} from 'vitest';
import {GuideCodec} from './GuideCodec';
import {DUPLICATE_STREAM, ERROR_STREAM, REPLAY_STREAM, RESET_STREAM} from './GuideStreams.fixtures';

/**
 * GuideCodec is the only translator between the guideline assistant's stream dialect and the kit.
 * It must send just the new question with the turn's ids and scope, and turn each frame into the
 * events that leave the chat with the backend's authoritative answer, its cited sources and its
 * server id - or with an error the user can retry.
 */
describe('GuideCodec', () => {
    beforeAll(async () => {
        await initTestAppAsync();
    });

    describe('encodeRequest', () => {
        it('sends the question, the thread as session, the scope and the turn as key', () => {
            const body = new GuideCodec().encodeRequest(
                request({runOptions: {scope: ['debt-to-income']}})
            );
            expect(body).toEqual({
                question: 'What is the max DTI?',
                sessionId: 't1',
                documentIds: ['debt-to-income'],
                idempotencyKey: 'u1'
            });
        });

        it('searches every document when the turn has no scope', () => {
            expect(new GuideCodec().encodeRequest(request()).documentIds).toEqual([]);
        });

        it('keeps the turn key for a retry, so the backend replays the answer', () => {
            expect(new GuideCodec().encodeRequest(request({trigger: 'retry'})).idempotencyKey).toBe(
                'u1'
            );
        });

        it.each<ChatRunTrigger>(['regenerate', 'edit'])(
            'sends a key of its own for %s, which asks for a new answer',
            trigger => {
                const body = new GuideCodec().encodeRequest(request({trigger}));
                expect(body.idempotencyKey).toBe('u1:r1');
            }
        );

        it('refuses a client-mode chat', () => {
            expect(() => new GuideCodec().encodeRequest(request({historyMode: 'client'}))).toThrow(
                /server-mode chats only/
            );
        });
    });

    describe('createDecoder', () => {
        it('appends chunks to the answer', () => {
            const decode = new GuideCodec().createDecoder(request());
            expect(decode({type: 'chunk', text: 'An appraisal'})).toEqual([
                {type: 'TEXT_MESSAGE_CHUNK', messageId: 'answer', delta: 'An appraisal'}
            ]);
        });

        it('clears the answer on reset', () => {
            const decode = new GuideCodec().createDecoder(request());
            expect(decode({type: 'reset'})).toEqual([
                {type: 'CUSTOM', name: 'xh.chat.textReplace', value: {text: ''}}
            ]);
        });

        it('replaces the answer, adds sources, records the server id and finishes on final_summary', () => {
            const decode = new GuideCodec().createDecoder(request()),
                events = decode({
                    type: 'final_summary',
                    answer: 'Valid for 120 days. [1]',
                    sources: [
                        {
                            documentId: 'd1',
                            friendlyName: 'Appraisal',
                            excerpt: 'Valid...',
                            marker: 1
                        }
                    ],
                    sourceType: 'library',
                    queryId: 'q1'
                });

            expect(events).toEqual([
                {
                    type: 'CUSTOM',
                    name: 'xh.chat.textReplace',
                    value: {text: 'Valid for 120 days. [1]'}
                },
                {
                    type: 'CUSTOM',
                    name: 'xh.chat.source',
                    value: {
                        id: 'q1-source-1',
                        title: 'Appraisal',
                        marker: 1,
                        metadata: {documentId: 'd1', excerpt: 'Valid...'}
                    }
                },
                {
                    type: 'CUSTOM',
                    name: 'xh.chat.message',
                    value: {role: 'assistant', serverId: 'q1'}
                },
                {
                    type: 'RUN_FINISHED',
                    threadId: 't1',
                    runId: 'r1',
                    metadata: {finishReason: 'stop', sourceType: 'library', duplicate: false}
                }
            ]);
        });

        it('fails the turn on error and on duplicate_in_progress, with the wait to retry', () => {
            const decode = new GuideCodec().createDecoder(request());
            expect(decode({type: 'error', message: 'Boom'})).toEqual([
                {type: 'RUN_ERROR', message: 'Boom', code: 'guide-error'}
            ]);
            expect(
                decode({type: 'duplicate_in_progress', message: 'Busy', retryAfterSeconds: 4})
            ).toEqual([
                {
                    type: 'RUN_ERROR',
                    message: 'Busy',
                    code: 'duplicate-in-progress',
                    metadata: {retryAfterSeconds: 4}
                }
            ]);
        });

        it('skips frames of an unknown type', () => {
            expect(new GuideCodec().createDecoder(request())({type: 'heartbeat'})).toEqual([]);
        });
    });

    describe('with a server-mode chat and recorded streams', () => {
        it('posts the question, and ends with the final answer after a reset', async () => {
            const chatModel = serveChat(RESET_STREAM);
            chatModel.runOptions = {scope: ['property-appraisal', 'policy-exceptions']};

            await chatModel.sendAsync('How long does an appraisal stay valid?');

            const [req] = hoistCore.requestsTo('guide/query'),
                [userMessage, answer] = chatModel.messages;
            expect(req.json).toEqual({
                question: 'How long does an appraisal stay valid?',
                sessionId: 'thread-1',
                documentIds: ['property-appraisal', 'policy-exceptions'],
                idempotencyKey: userMessage.id
            });

            expect(answer.status).toBe('complete');
            expect(answer.text).toMatch(/^Here is what the guidelines say/);
            expect(answer.text).not.toContain('Checking Property and Appraisal first');
            expect(answer.text).toContain('120 days from its effective date. An update');
            expect(answer.metadata).toMatchObject({
                serverId: expect.any(String),
                sourceType: 'library'
            });
            expect(answer.parts.filter(it => it.type === 'source')).toMatchObject([
                {
                    title: 'Property and Appraisal',
                    marker: 1,
                    metadata: {documentId: 'property-appraisal'}
                },
                {title: 'Policy Exceptions', marker: 2, metadata: {documentId: 'policy-exceptions'}}
            ]);
        });

        it('takes a replayed answer whole, and marks it a duplicate', async () => {
            const chatModel = serveChat(REPLAY_STREAM);

            await chatModel.sendAsync('How long does an appraisal stay valid?');

            expect(chatModel.lastMessage.text).toMatch(/^Here is what the guidelines say/);
            expect(chatModel.lastMessage.metadata.duplicate).toBe(true);
        });

        it('fails a turn still running elsewhere, with the wait before a retry', async () => {
            const chatModel = serveChat(DUPLICATE_STREAM);

            await chatModel.sendAsync('What credit score does a jumbo loan need?');

            const error = chatModel.lastError as ChatRunError;
            expect(chatModel.lastMessage.status).toBe('error');
            expect(error.code).toBe('duplicate-in-progress');
            expect(error.retryAfterSeconds).toBe(4);
        });

        it('fails a turn whose answer fails partway', async () => {
            const chatModel = serveChat(ERROR_STREAM);

            await chatModel.sendAsync('How old can a credit report be?');

            const error = chatModel.lastError as ChatRunError;
            expect(chatModel.lastMessage.status).toBe('error');
            expect(error.code).toBe('guide-error');
            expect(error.message).toBe('The answer failed partway. Try again.');
        });
    });
});

//------------------
// Implementation
//------------------
function request(overrides: Partial<ChatRunRequest> = {}): ChatRunRequest {
    const question = new ChatMessage({id: 'u1', role: 'user', content: 'What is the max DTI?'});
    return {
        threadId: 't1',
        runId: 'r1',
        historyMode: 'server',
        trigger: 'submit',
        turnId: 'u1',
        stepIndex: 0,
        messages: [question],
        newMessages: [question],
        replacedMessageId: null,
        runOptions: null,
        tools: [],
        signal: new AbortController().signal,
        ...overrides
    } as ChatRunRequest;
}

/** A server-mode chat whose query endpoint answers with a recorded stream. */
function serveChat(stream: string): ChatModel {
    hoistCore.route(
        'POST',
        'guide/query',
        () => new Response(stream, {headers: {'Content-Type': 'text/event-stream'}})
    );
    const ret = new ChatModel({
        threadId: 'thread-1',
        historyMode: 'server',
        transport: new SseChatTransport({url: 'guide/query', codec: new GuideCodec()})
    });
    onTestFinished(() => ret.destroy());
    return ret;
}
