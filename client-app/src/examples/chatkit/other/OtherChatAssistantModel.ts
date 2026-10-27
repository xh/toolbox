import {ChatWorkspaceModel} from '@xh/hoist-chat-kit/desktop/cmp/workspace';
import {ChatThreadsModel} from '@xh/hoist-chat-kit/threads';
import type {LoadSpec} from '@xh/hoist/core';
import {HoistModel, managed} from '@xh/hoist/core';
import {OtherChatConversation} from './OtherChatConversation';
import {OtherChatModel} from './OtherChatModel';
import {OtherChatThreadStore} from './OtherChatThreadStore';

/**
 * The kit's thread list and workspace over a chat that runs on another library. The kit owns the
 * threads - listing, search, rename, delete, selection and the row states - and the other library
 * owns the conversation, through one `OtherChatConversation` per open thread.
 */
export class OtherChatAssistantModel extends HoistModel {
    @managed readonly chatModel = new OtherChatModel();
    @managed readonly threadsModel: ChatThreadsModel;
    @managed readonly workspaceModel: ChatWorkspaceModel;

    constructor() {
        super();
        const {chatModel} = this;

        this.threadsModel = new ChatThreadsModel({
            store: new OtherChatThreadStore(chatModel.backend),
            createConversation: spec => new OtherChatConversation(chatModel, spec)
        });

        this.workspaceModel = new ChatWorkspaceModel({
            threadsModel: this.threadsModel,
            persistWith: {localStorageKey: 'chatKitApp', path: 'otherChatWorkspace'}
        });

        // The other library shows one thread at a time. It follows the selection, which also
        // returns to a thread whose conversation stayed open for a running reply.
        this.addReaction({
            track: () => this.threadsModel.selectedThreadId,
            run: threadId => chatModel.showThread(threadId),
            fireImmediately: true
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        await this.workspaceModel.loadAsync(loadSpec);
    }
}
