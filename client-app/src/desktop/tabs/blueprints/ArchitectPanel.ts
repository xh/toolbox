import {ChatModel} from '@xh/hoist-chat-kit/core';
import {chatClearButton, chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {AnthropicCodec, HoistChatTransport} from '@xh/hoist-chat-kit/transport';
import {placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, lookup, managed, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {BlueprintsPanelModel} from './BlueprintsPanelModel';

/** The Architect: a chat with Claude, relayed by Toolbox's `llm/stream`, that edits the blueprint. */
export class ArchitectModel extends HoistModel {
    @lookup(BlueprintsPanelModel) panelModel: BlueprintsPanelModel;

    @managed chatModel = new ChatModel({
        transport: new HoistChatTransport({
            url: 'llm/stream',
            codec: new AnthropicCodec({cacheControl: true})
        }),
        // Each step is a model call, and counts toward the server's per-user `llmRateLimit`.
        maxSteps: 12
    });

    get hasAccess(): boolean {
        return XH.getUser().hasRole('TOOLBOX_LLM_USER');
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
