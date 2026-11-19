import {
    architectChatTools,
    architectPrompt,
    blueprintContextProvider
} from '@xh/hoist-chat-kit/blueprint';
import {ChatModel} from '@xh/hoist-chat-kit/core';
import {chatClearButton, chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {AnthropicCodec, HoistChatTransport} from '@xh/hoist-chat-kit/transport';
import {placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, lookup, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {observableRef, runInAction} from '@xh/hoist/mobx';
import {BlueprintsPanelModel} from './BlueprintsPanelModel';

/**
 * The Architect: a chat with Claude, relayed by Toolbox's `llm/stream`, that edits the blueprint
 * through chat kit's Architect tools, run in the browser against the panel's `BlueprintModel`.
 */
export class ArchitectModel extends HoistModel {
    @lookup(BlueprintsPanelModel) panelModel: BlueprintsPanelModel;

    /** Null until linked to the panel's blueprint. */
    @observableRef accessor chatModel: ChatModel = null;

    get hasAccess(): boolean {
        return XH.getUser().hasRole('TOOLBOX_LLM_USER');
    }

    override onLinked() {
        const {blueprintModel} = this.panelModel;
        runInAction(() => {
            this.chatModel = this.markManaged(
                new ChatModel({
                    transport: new HoistChatTransport({
                        url: 'llm/stream',
                        codec: new AnthropicCodec({
                            system: architectPrompt(blueprintModel),
                            cacheControl: true
                        })
                    }),
                    tools: architectChatTools(blueprintModel),
                    contextProviders: [blueprintContextProvider(blueprintModel)],
                    // Each step is a model call, and counts toward the server's per-user `llmRateLimit`.
                    maxSteps: 12
                })
            );
        });
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
            headerItems: [chatClearButton({chatModel})],
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
