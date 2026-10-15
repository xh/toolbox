import type {ChatDocumentRequest} from '@xh/hoist-chat-kit/core';
import {ChatSidePanelModel} from '@xh/hoist-chat-kit/core';
import {hoistCore, hoistError, initTestAppAsync} from '@xh/hoist/test-support';
import {beforeAll, describe, expect, it, onTestFinished, vi} from 'vitest';
import type {GuideDocumentDetail} from './GuideApi';
import {GuideDocumentModel} from './GuideDocumentModel';

/**
 * GuideDocumentModel is the app's document viewer behind the kit's side panel. For each document
 * request it must load the cited document once, find the cited passage from its excerpt - which
 * the backend cuts short - and report its progress to the panel's status strip.
 */
describe('GuideDocumentModel', () => {
    beforeAll(async () => {
        hoistCore.route('GET', 'guide/documents/:documentId', ({params}) =>
            params.documentId === DOCUMENT.documentId
                ? DOCUMENT
                : hoistError(404, {name: 'NotFoundException', message: 'Document not found.'})
        );
        await initTestAppAsync();
    });

    it('finds a passage from its excerpt, cut short or not', () => {
        expect(GuideDocumentModel.findPassage(DOCUMENT, 'Loans above 2 million...')?.id).toBe(
            'property-appraisal-2'
        );
        expect(GuideDocumentModel.findPassage(DOCUMENT, DOCUMENT.passages[0].text)?.id).toBe(
            'property-appraisal-1'
        );
        expect(GuideDocumentModel.findPassage(DOCUMENT, 'Boats are out of scope.')).toBeNull();
        expect(GuideDocumentModel.findPassage(DOCUMENT, null)).toBeNull();
    });

    it('opens a cited document at its passage, and reports it located', async () => {
        const {model, sidePanel} = createModel();

        sidePanel.open(request('Loans above 2 million dollars need a second...'));

        expect(sidePanel.documentStatus).toEqual({state: 'opening'});
        await vi.waitFor(() => expect(sidePanel.documentStatus).toEqual({state: 'located'}));
        expect(model.document.documentName).toBe('Property and Appraisal');
        expect(model.located).toEqual({passageId: 'property-appraisal-2'});
    });

    it('shows the document from the start when the passage is not in it', async () => {
        const {model, sidePanel} = createModel();

        sidePanel.open(request('A passage that was since removed.'));

        await vi.waitFor(() => expect(sidePanel.documentStatus).toEqual({state: 'notLocated'}));
        expect(model.document).not.toBeNull();
        expect(model.located).toBeNull();
    });

    it('loads each document once, and jumps to the next passage without a reload', async () => {
        const {model, sidePanel} = createModel(),
            before = hoistCore.requestsTo(DOCUMENT_URL).length;

        sidePanel.open(request('An appraisal stays valid'));
        await vi.waitFor(() => expect(sidePanel.documentStatus?.state).toBe('located'));
        sidePanel.open(request('Condominium units must be'));

        expect(sidePanel.documentStatus).toEqual({state: 'located'});
        expect(model.located).toEqual({passageId: 'property-appraisal-3'});
        expect(hoistCore.requestsTo(DOCUMENT_URL)).toHaveLength(before + 1);
    });

    it('reports a document the server does not have as an error, with its status', async () => {
        const {sidePanel} = createModel();

        sidePanel.open(request('Anything', 'retired-guide'));

        await vi.waitFor(() => expect(sidePanel.documentStatus?.state).toBe('error'));
        expect(sidePanel.documentStatus.error.httpStatus).toBe(404);
    });
});

//------------------
// Implementation
//------------------
const DOCUMENT: GuideDocumentDetail = {
    documentId: 'property-appraisal',
    documentName: 'Property and Appraisal',
    passages: [
        {
            id: 'property-appraisal-1',
            text: 'An appraisal stays valid for 120 days from its effective date.'
        },
        {
            id: 'property-appraisal-2',
            text: 'Loans above 2 million dollars need a second full appraisal,\nand the desk uses the lower of the two values.'
        },
        {
            id: 'property-appraisal-3',
            text: 'Condominium units must be in a warrantable project.'
        }
    ]
};

const DOCUMENT_URL = 'guide/documents/property-appraisal';

function request(passage: string, documentId = DOCUMENT.documentId): ChatDocumentRequest {
    return {
        type: 'document',
        source: {type: 'source', id: 's1', title: 'Doc', metadata: {documentId, excerpt: passage}},
        passage
    };
}

function createModel() {
    const sidePanel = new ChatSidePanelModel({documentRenderer: () => null}),
        model = new GuideDocumentModel(sidePanel);
    onTestFinished(() => {
        model.destroy();
        sidePanel.destroy();
    });
    return {model, sidePanel};
}
