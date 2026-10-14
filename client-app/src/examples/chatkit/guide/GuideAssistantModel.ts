import type {ChatSourcePart} from '@xh/hoist-chat-kit/core';
import {ChatModel} from '@xh/hoist-chat-kit/core';
import {ChatThreadsModel} from '@xh/hoist-chat-kit/threads';
import {SseChatTransport} from '@xh/hoist-chat-kit/transport';
import type {LoadSpec} from '@xh/hoist/core';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {action, bindableRef, observableRef} from '@xh/hoist/mobx';
import type {GuideDocument, GuideRunOptions} from './GuideApi';
import {GuideCodec} from './GuideCodec';
import {GuideThreadStore} from './GuideThreadStore';

/**
 * Model for the guideline assistant - a server-owned conversation over a small document library.
 * The backend keeps the chats, their messages and their feedback, so the browser holds only the
 * chats it has open. See the README in this folder for the architecture.
 *
 * - `threadsModel` lists the user's chats and opens a server-mode `ChatModel` for each one the
 *   user selects, or that still has a turn running.
 * - Each chat streams answers over an `SseChatTransport`, decoded by a `GuideCodec`.
 * - The document scope is each chat's own run options, as a `GuideRunOptions`. A new chat starts
 *   with the scope of the chat the user was in.
 * - Each answer's sources carry the `marker` that cites them, so a message list with
 *   `citationMarkers` turns `[n]` in the text into buttons. `showSource()` is their click handler.
 */
export class GuideAssistantModel extends HoistModel {
    @managed readonly threadsModel: ChatThreadsModel;

    /** The library's documents, for a scope picker. */
    @observableRef accessor documents: GuideDocument[] = [];

    /** The source the user asked to see, for a document viewer, or null. */
    @bindableRef accessor viewedSource: ChatSourcePart = null;

    constructor() {
        super();
        this.threadsModel = new ChatThreadsModel({
            store: new GuideThreadStore(),
            createChatModel: ({threadId}) =>
                new ChatModel({
                    threadId,
                    historyMode: 'server',
                    transport: new SseChatTransport({url: 'guide/query', codec: new GuideCodec()}),
                    runOptions: {scope: []} as GuideRunOptions,
                    // The backend requires a comment with a down rating.
                    feedback: {commentOn: 'negative', requireComment: true}
                })
        });
    }

    /** Ids of the documents the selected chat's next question searches. Empty for all. */
    get scope(): string[] {
        return (this.threadsModel.chatModel?.runOptions as GuideRunOptions)?.scope ?? [];
    }

    /** Set the documents the selected chat's next question searches. Empty for all. */
    setScope(documentIds: string[]) {
        const {chatModel} = this.threadsModel;
        if (chatModel) chatModel.runOptions = {...chatModel.runOptions, scope: documentIds};
    }

    /** Start a new chat, and select it, with the current chat's scope. */
    newThread(): ChatModel {
        return this.threadsModel.newThread({runOptions: {scope: this.scope} as GuideRunOptions});
    }

    /** Show a cited source - the `onSourceClick` handler for the message list. */
    showSource(source: ChatSourcePart) {
        this.viewedSource = source;
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const [{documents}] = await Promise.all([
            XH.fetchJson({url: 'guide/documents'}, {loadSpec}),
            this.threadsModel.loadAsync(loadSpec)
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
