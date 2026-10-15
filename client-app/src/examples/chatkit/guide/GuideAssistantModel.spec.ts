import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {beforeAll, describe, expect, it, onTestFinished} from 'vitest';
import {GuideAssistantModel} from './GuideAssistantModel';
import {RESET_STREAM} from './GuideStreams.fixtures';

/**
 * GuideAssistantModel wires the guideline assistant's store and codec into the kit's thread layer.
 * It must load the library with the chat list, carry the document scope into new chats and their
 * questions, and send each rating to the backend by the answer's server id.
 */
describe('GuideAssistantModel', () => {
    beforeAll(async () => {
        hoistCore.route('GET', 'guide/documents', () => ({documents: DOCUMENTS}));
        hoistCore.route('GET', 'guide/chats', () => ({
            chats: [
                {
                    sessionId: 's1',
                    title: 'Appraisals',
                    lastActivityAt: 1_792_000_000,
                    isRunning: false
                }
            ]
        }));
        hoistCore.route('GET', 'guide/chats/:sessionId/messages', () => ({
            messages: [
                {
                    queryId: 'q1',
                    question: 'How long is an appraisal valid?',
                    answer: '120 days. [1]',
                    sources: [],
                    sourceType: 'library',
                    documentIds: ['property-appraisal'],
                    createdAt: 1_792_000_000
                }
            ]
        }));
        await initTestAppAsync();
    });

    it('loads the library with the chat list', async () => {
        const model = createModel();

        await model.loadAsync();

        expect(model.documents).toEqual(DOCUMENTS);
        expect(model.threadsModel.threads.map(it => it.id)).toEqual(['s1']);
    });

    it('starts a new chat with the current scope, and sends it with the question', async () => {
        hoistCore.route(
            'POST',
            'guide/query',
            () => new Response(RESET_STREAM, {headers: {'Content-Type': 'text/event-stream'}})
        );
        const model = createModel();
        model.setScope(['property-appraisal']);

        const chatModel = model.threadsModel.newThread();
        expect(model.scope).toEqual(['property-appraisal']);
        await chatModel.sendAsync('How long is an appraisal valid?');

        const [req] = hoistCore.requestsTo('guide/query');
        expect(req.json).toMatchObject({
            sessionId: chatModel.threadId,
            documentIds: ['property-appraisal']
        });
    });

    it('sends a rating of a loaded answer by its query id', async () => {
        hoistCore.route('PATCH', 'guide/messages/:queryId', ({params, json}) => ({
            queryId: params.queryId,
            rating: json.rating
        }));
        const model = createModel();
        await model.threadsModel.selectThreadAsync('s1');
        const {chatModel} = model.threadsModel;

        await chatModel.submitFeedbackAsync('q1', 'negative', 'Missing the update rule.');

        expect(hoistCore.requestsTo('guide/messages/q1')[0].json).toEqual({
            rating: 'down',
            comment: 'Missing the update rule.'
        });
        expect(chatModel.getMessage('q1').metadata.feedback).toEqual({
            rating: 'negative',
            comment: 'Missing the update rule.'
        });
    });
});

//------------------
// Implementation
//------------------
const DOCUMENTS = [
    {documentId: 'property-appraisal', documentName: 'Property and Appraisal', passageCount: 4},
    {documentId: 'policy-exceptions', documentName: 'Policy Exceptions', passageCount: 4}
];

function createModel(): GuideAssistantModel {
    const ret = new GuideAssistantModel();
    onTestFinished(() => ret.destroy());
    return ret;
}
