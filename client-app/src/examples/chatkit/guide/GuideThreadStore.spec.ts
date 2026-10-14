import {hoistCore, hoistError, initTestAppAsync} from '@xh/hoist/test-support';
import {beforeAll, describe, expect, it} from 'vitest';
import type {GuideChatRecord, GuideMessageRecord} from './GuideApi';
import {GuideThreadStore} from './GuideThreadStore';

/**
 * GuideThreadStore maps the guideline assistant's REST records to the kit's thread shapes. A
 * reloaded chat must match the one that streamed - server ids for feedback, ratings, sources with
 * their markers, and each question's scope - and a missing chat must read as the kit expects.
 */
describe('GuideThreadStore', () => {
    beforeAll(async () => {
        hoistCore.route('GET', 'guide/chats', () => ({chats: CHATS}));
        hoistCore.route('GET', 'guide/chats/:sessionId/messages', ({params}) =>
            params.sessionId === 's1'
                ? {messages: MESSAGES}
                : hoistError(404, {name: 'NotFoundException', message: 'Chat not found.'})
        );
        await initTestAppAsync();
    });

    const store = new GuideThreadStore();

    describe('listThreadsAsync', () => {
        it('lists chats as threads, with activity in epoch millis', async () => {
            const {threads, nextCursor} = await store.listThreadsAsync({});
            expect(threads).toEqual([
                {
                    id: 's1',
                    title: 'Jumbo reserves',
                    lastActivityAt: 1_792_000_000_000,
                    isRunning: false
                },
                {
                    id: 's2',
                    title: 'Appraisal age',
                    lastActivityAt: 1_791_990_000_000,
                    isRunning: true
                }
            ]);
            expect(nextCursor).toBeUndefined();
        });

        it('searches titles, as the backend cannot', async () => {
            const {threads} = await store.listThreadsAsync({search: 'APPRAISAL'});
            expect(threads.map(it => it.id)).toEqual(['s2']);
        });
    });

    describe('loadMessagesAsync', () => {
        it('maps each record to a question and an answer, keyed by its query id', async () => {
            const {messages} = await store.loadMessagesAsync({threadId: 's1'});

            expect(messages.slice(0, 2)).toEqual([
                {
                    id: 'q1-question',
                    role: 'user',
                    content: 'Can gifts cover jumbo reserves?',
                    createdAt: 1_792_000_000_000,
                    metadata: {runOptions: {scope: ['assets-reserves']}}
                },
                {
                    id: 'q1',
                    role: 'assistant',
                    createdAt: 1_792_000_000_000,
                    parts: [
                        {type: 'text', id: 'answer', text: 'No. [1]', state: 'done'},
                        {
                            type: 'source',
                            id: 'q1-source-1',
                            title: 'Assets and Reserves',
                            marker: 1,
                            metadata: {documentId: 'assets-reserves', excerpt: 'Gifts may not...'}
                        }
                    ],
                    metadata: {
                        serverId: 'q1',
                        sourceType: 'library',
                        feedback: {rating: 'negative', comment: 'Too short.'}
                    }
                }
            ]);
        });

        it('leaves out feedback for an answer with no rating', async () => {
            const {messages} = await store.loadMessagesAsync({threadId: 's1'});
            expect(messages[3].metadata).toEqual({serverId: 'q2', sourceType: 'none'});
            expect(messages[3].parts).toHaveLength(1);
        });

        it('rejects with httpStatus 404 for a chat with no question yet', async () => {
            await expect(store.loadMessagesAsync({threadId: 'new-chat'})).rejects.toMatchObject({
                httpStatus: 404
            });
        });
    });

    describe('edits', () => {
        it('renames a chat', async () => {
            hoistCore.route('PATCH', 'guide/chats/s1', ({json}) => ({sessionId: 's1', ...json}));

            await store.renameThreadAsync('s1', 'Gift funds');

            expect(hoistCore.requestsTo('guide/chats/s1')[0].json).toEqual({title: 'Gift funds'});
        });

        it('deletes each chat, and counts a chat the backend lacks as deleted', async () => {
            hoistCore.route('DELETE', 'guide/chats/:sessionId', ({params}) =>
                params.sessionId === 's1'
                    ? {sessionId: 's1', deleted: true}
                    : hoistError(404, {name: 'NotFoundException', message: 'Chat not found.'})
            );

            await expect(store.deleteThreadsAsync(['s1', 'gone'])).resolves.toBeUndefined();

            expect(hoistCore.requestsTo('guide/chats/s1')).toHaveLength(1);
            expect(hoistCore.requestsTo('guide/chats/gone')).toHaveLength(1);
        });

        it('rates an answer by its server id, as up or down', async () => {
            hoistCore.route('PATCH', 'guide/messages/:queryId', ({params, json}) => ({
                queryId: params.queryId,
                rating: json.rating
            }));

            await store.submitFeedbackAsync({
                ...FEEDBACK,
                rating: 'negative',
                comment: 'Out of date.'
            });
            await store.submitFeedbackAsync({...FEEDBACK, rating: 'positive'});
            await store.submitFeedbackAsync({...FEEDBACK, rating: null});

            expect(hoistCore.requestsTo('guide/messages/q1').map(it => it.json)).toEqual([
                {rating: 'down', comment: 'Out of date.'},
                {rating: 'up', comment: null},
                {rating: null, comment: null}
            ]);
        });

        it('refuses to rate an answer with no server id', async () => {
            await expect(store.submitFeedbackAsync({...FEEDBACK, serverId: null})).rejects.toThrow(
                /no id from the server/
            );
        });
    });
});

//------------------
// Implementation
//------------------
const CHATS: GuideChatRecord[] = [
    {sessionId: 's1', title: 'Jumbo reserves', lastActivityAt: 1_792_000_000, isRunning: false},
    {sessionId: 's2', title: 'Appraisal age', lastActivityAt: 1_791_990_000, isRunning: true}
];

const MESSAGES: GuideMessageRecord[] = [
    {
        queryId: 'q1',
        question: 'Can gifts cover jumbo reserves?',
        answer: 'No. [1]',
        sources: [
            {
                documentId: 'assets-reserves',
                friendlyName: 'Assets and Reserves',
                excerpt: 'Gifts may not...',
                marker: 1
            }
        ],
        sourceType: 'library',
        documentIds: ['assets-reserves'],
        createdAt: 1_792_000_000,
        feedback: 'down',
        comment: 'Too short.'
    },
    {
        queryId: 'q2',
        question: 'Can I bring my dog?',
        answer: 'I could not find this in the guideline library.',
        sources: [],
        sourceType: 'none',
        documentIds: [],
        createdAt: 1_792_000_060
    }
];

const FEEDBACK = {threadId: 's1', messageId: 'm1', serverId: 'q1', runId: 'r1', rating: null};
