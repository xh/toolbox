import {ChatModel} from '@xh/hoist-chat-kit/core';
import type {ChatScopeDocument} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {ChatWorkspaceModel} from '@xh/hoist-chat-kit/desktop/cmp/workspace';
import {ChatThreadsModel} from '@xh/hoist-chat-kit/threads';
import {SseChatTransport} from '@xh/hoist-chat-kit/transport';
import type {LoadSpec} from '@xh/hoist/core';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {action, computed, observableRef} from '@xh/hoist/mobx';
import type {GuideDocument, GuideRunOptions} from './GuideApi';
import {GuideCodec} from './GuideCodec';
import {GuideDocumentModel} from './GuideDocumentModel';
import {guideDocumentView} from './GuideDocumentView';
import {GuideThreadStore} from './GuideThreadStore';

/**
 * Model for the guideline assistant - a server-owned conversation over a small document library.
 * The backend keeps the chats, their messages and their feedback, so the browser holds only the
 * chats it has open. See the README in this folder for the architecture.
 *
 * - `threadsModel` lists the user's chats and opens a server-mode `ChatModel` for each one the
 *   user selects, or that still has a turn running.
 * - `workspaceModel` lays out the kit's chat workspace over the chats: the thread sidebar, the
 *   conversation, and a side panel for cited documents.
 * - Each chat streams answers over an `SseChatTransport`, decoded by a `GuideCodec`.
 * - The document scope is each chat's own run options, as a `GuideRunOptions`. A new chat starts
 *   with the scope of the chat the user was in.
 * - Each answer's sources are documents, with the `marker` that cites them. A click on a citation
 *   or a source opens the document in the side panel, where `documentModel` renders it.
 */
export class GuideAssistantModel extends HoistModel {
    @managed readonly threadsModel: ChatThreadsModel;
    @managed readonly workspaceModel: ChatWorkspaceModel;
    @managed readonly documentModel: GuideDocumentModel;

    /** The library's documents. */
    @observableRef accessor documents: GuideDocument[] = [];

    /** The library's documents, for the kit's scope chip. */
    @computed
    get scopeDocuments(): ChatScopeDocument[] {
        return this.documents.map(it => ({id: it.documentId, name: it.documentName}));
    }

    /** Ids of the documents the selected chat's next question searches. Empty for all. */
    get scope(): string[] {
        return (this.threadsModel.chatModel?.runOptions as GuideRunOptions)?.scope ?? [];
    }

    constructor() {
        super();
        const documents = () => this.documents;

        this.threadsModel = new ChatThreadsModel({
            store: new GuideThreadStore({documents}),
            // A new chat takes the scope of the chat selected when it starts - so New Chat keeps
            // the scope, from any button. A loaded chat takes the scope of its last question.
            createChatModel: ({threadId, isNew}) =>
                new ChatModel({
                    threadId,
                    historyMode: 'server',
                    transport: new SseChatTransport({
                        url: 'guide/query',
                        codec: new GuideCodec({documents})
                    }),
                    runOptions: {scope: isNew ? this.scope : []} as GuideRunOptions,
                    // The backend requires a comment with a down rating.
                    feedback: {commentOn: 'negative', requireComment: true}
                })
        });

        this.workspaceModel = new ChatWorkspaceModel({
            threadsModel: this.threadsModel,
            persistWith: {localStorageKey: 'chatKitApp', path: 'guideWorkspace'},
            documentRenderer: () => guideDocumentView({model: this.documentModel})
        });

        this.documentModel = new GuideDocumentModel(this.workspaceModel.sidePanel);
    }

    /** Set the documents the selected chat's next question searches. Empty for all. */
    setScope(documentIds: string[]) {
        const {chatModel} = this.threadsModel;
        if (chatModel) chatModel.runOptions = {...chatModel.runOptions, scope: documentIds};
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const [{documents}] = await Promise.all([
            XH.fetchJson({url: 'guide/documents'}, {loadSpec}),
            this.workspaceModel.loadAsync(loadSpec)
        ]);
        if (!loadSpec.isStale) this.setDocuments(documents);
    }

    //------------------
    // Implementation
    //------------------
    @action
    private setDocuments(documents: GuideDocument[]) {
        this.documents = documents;
    }
}
