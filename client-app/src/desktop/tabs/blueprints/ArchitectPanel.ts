import {
    architectChatTools,
    architectPrompt,
    blueprintContextProvider
} from '@xh/hoist-chat-kit/blueprint';
import {ChatModel} from '@xh/hoist-chat-kit/core';
import {chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {ChatThreadsModel} from '@xh/hoist-chat-kit/threads';
import {AnthropicCodec, HoistChatTransport} from '@xh/hoist-chat-kit/transport';
import {placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, lookup, XH} from '@xh/hoist/core';
import type {LoadSpec} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {observableRef, runInAction} from '@xh/hoist/mobx';
import {LocalThreadStore} from '../chatkit/integrations/LocalThreadStore';
import {BlueprintsPanelModel} from './BlueprintsPanelModel';

/**
 * The Architect: a chat with Claude, relayed by Toolbox's `llm/stream`, that edits the blueprint
 * through chat kit's Architect tools, run in the browser against the panel's `BlueprintModel`, and
 * answers questions with blueprints of their own through `show_ui`. Its threads persist in local
 * storage, and the latest reopens on load.
 */
export class ArchitectModel extends HoistModel {
    @lookup(BlueprintsPanelModel) panelModel: BlueprintsPanelModel;

    readonly store = new LocalThreadStore({
        storageKey: 'blueprints.architect.threads',
        seed: () => [],
        delayMs: 0
    });

    /** Null until linked to the panel's blueprint. */
    @observableRef accessor threadsModel: ChatThreadsModel = null;

    get chatModel(): ChatModel {
        return this.threadsModel?.chatModel;
    }

    get hasAccess(): boolean {
        return XH.getUser().hasRole('TOOLBOX_LLM_USER');
    }

    newThread() {
        this.threadsModel.newThread();
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {threadsModel} = this;
        if (!threadsModel || threadsModel.selectedThreadId) return;

        await threadsModel.loadAsync(loadSpec);
        const latest = threadsModel.threads[0];
        if (latest) {
            await threadsModel.selectThreadAsync(latest.id);
        } else {
            threadsModel.newThread();
        }
    }

    override onLinked() {
        runInAction(() => {
            this.threadsModel = this.markManaged(
                new ChatThreadsModel({
                    store: this.store,
                    createChatModel: ({threadId}) => this.createChatModel(threadId)
                })
            );
        });
    }

    //------------------
    // Implementation
    //------------------
    private createChatModel(threadId: string): ChatModel {
        const {blueprintModel, answerCatalog: catalog} = this.panelModel,
            save = () =>
                this.store.saveThread({
                    id: chatModel.threadId,
                    messages: chatModel.getMessageSpecs()
                }),
            chatModel = new ChatModel({
                threadId,
                transport: new HoistChatTransport({
                    url: 'llm/stream',
                    codec: new AnthropicCodec({
                        system: architectPrompt({
                            catalogs: blueprintModel.catalogs,
                            registry: catalog.registry,
                            withAnswers: true
                        }),
                        cacheControl: true
                    })
                }),
                catalog,
                tools: architectChatTools(blueprintModel),
                contextProviders: [blueprintContextProvider(blueprintModel)],
                // Each step is a model call, and counts toward the server's per-user `llmRateLimit`.
                maxSteps: 12,
                onTurnComplete: save,
                onTurnPause: save
            });
        return chatModel;
    }
}

export const architectPanel = hoistCmp.factory({
    displayName: 'ArchitectPanel',
    model: creates(ArchitectModel),

    render({model}) {
        if (!model.hasAccess) {
            return placeholder(
                Icon.lock(),
                'The Architect needs the TOOLBOX_LLM_USER role. Contact XH to request access.'
            );
        }
        const {chatModel} = model;
        if (!chatModel) return null;
        return chatPanel({
            model: chatModel,
            flex: 1,
            headerItems: [
                button({
                    icon: Icon.add(),
                    tooltip: 'New chat',
                    minimal: true,
                    onClick: () => model.newThread()
                })
            ],
            emptyStateProps: {
                icon: null,
                title: 'Ask the Architect',
                text: 'Describe the view you want, or a change to this one.'
            },
            composerProps: {placeholder: 'Show my positions by sector...'},
            messageListProps: {assistantName: 'Architect'}
        });
    }
});
