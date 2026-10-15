import type {ChatDocumentRequest, ChatSidePanelModel} from '@xh/hoist-chat-kit/core';
import {HoistModel, XH} from '@xh/hoist/core';
import {action, observableRef} from '@xh/hoist/mobx';
import {find} from 'lodash';
import type {GuideDocumentDetail, GuidePassage} from './GuideApi';

/**
 * Model for the guideline assistant's document viewer, in the side panel of the chat workspace.
 * The chat kit has no viewer of its own: it opens a `ChatDocumentRequest` in the panel when the
 * user clicks a citation or a source, and the app renders the document.
 *
 * The model follows the panel's open request. It loads the cited document's passages once each,
 * finds the cited passage by its excerpt, and reports its progress to the panel's status strip:
 * `opening` while it loads, then `located` or `notLocated`, or `error` if the load fails. It shows
 * a document as one page, so it reports page 1 of 1.
 */
export class GuideDocumentModel extends HoistModel {
    /** The side panel whose document requests this model renders. */
    readonly sidePanel: ChatSidePanelModel;

    /** The document shown, or null while one opens. */
    @observableRef accessor document: GuideDocumentDetail = null;

    /**
     * The passage the open request cites, or null if it was not found. A new object for each
     * request, so the view scrolls to it again for a second citation of the same passage.
     */
    @observableRef accessor located: {passageId: string} = null;

    constructor(sidePanel: ChatSidePanelModel) {
        super();
        this.sidePanel = sidePanel;
        this.addReaction({
            track: () => sidePanel.request,
            run: request => {
                if (request?.type === 'document') this.showAsync(request);
            },
            fireImmediately: true
        });
    }

    /**
     * The passage of a document that an excerpt cites, or null. An excerpt is the start of its
     * passage, cut at a word and ended with '...' if the passage is long.
     */
    static findPassage(document: GuideDocumentDetail, excerpt: string): GuidePassage {
        const target = normalize(excerpt).replace(/(\.\.\.|…)$/, '');
        if (!target) return null;
        return find(document.passages, it => normalize(it.text).startsWith(target)) ?? null;
    }

    //------------------
    // Implementation
    //------------------
    private readonly cache = new Map<string, GuideDocumentDetail>();

    private async showAsync(request: ChatDocumentRequest) {
        const {sidePanel} = this,
            documentId: string = request.source.metadata?.documentId,
            isCurrent = () => sidePanel.request === request;

        if (!documentId) {
            sidePanel.setDocumentStatus({
                state: 'error',
                error: {message: 'This source does not name a document.'}
            });
            return;
        }

        let document = this.cache.get(documentId);
        if (!document) {
            this.setDocument(null);
            sidePanel.setDocumentStatus({state: 'opening'});
            try {
                document = await XH.fetchJson({
                    url: `guide/documents/${encodeURIComponent(documentId)}`
                });
                this.cache.set(documentId, document);
            } catch (e) {
                if (isCurrent()) {
                    sidePanel.setDocumentStatus({
                        state: 'error',
                        error: {
                            httpStatus: e.httpStatus,
                            message: e.message,
                            retry: () => this.showAsync(request)
                        }
                    });
                }
                return;
            }
            if (!isCurrent()) return;
        }

        const passage = GuideDocumentModel.findPassage(document, request.passage);
        this.setDocument(document, passage);
        // The documents have no pages, so the panel shows no page label.
        sidePanel.setDocumentStatus({state: passage ? 'located' : 'notLocated'});
    }

    @action
    private setDocument(document: GuideDocumentDetail, passage: GuidePassage = null) {
        this.document = document;
        this.located = passage ? {passageId: passage.id} : null;
    }
}

/** Text with its whitespace collapsed, for a match that ignores line breaks. */
function normalize(text: string): string {
    return (text ?? '').replace(/\s+/g, ' ').trim();
}
