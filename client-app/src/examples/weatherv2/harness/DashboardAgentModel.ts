import {ChatModel, type ChatMessage} from '@xh/hoist-chat-kit/core';
import {AnthropicCodec, HoistChatTransport} from '@xh/hoist-chat-kit/transport';
import type {PlainObject} from '@xh/hoist/core';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import type {AppModel} from '../AppModel';

/**
 * Model for the Dashboard Agent: a conversation with Claude that builds and edits the dashboard.
 *
 * The chat streams each model call through the server's `llm/stream` proxy, which relays the
 * Anthropic Messages API. The system prompt is rebuilt for every call from the live dashboard, so
 * the model sees the changes its own tools made earlier in the turn. The tools run here in the
 * browser, via `LlmToolService`.
 */
export class DashboardAgentModel extends HoistModel {
    @managed readonly chatModel: ChatModel;

    constructor() {
        super();
        this.chatModel = new ChatModel({
            transport: new HoistChatTransport({
                url: 'llm/stream',
                codec: new AnthropicCodec({
                    system: () => this.buildSystemPrompt(),
                    cacheControl: true
                }),
                track: {category: 'WeatherV2', message: 'Dashboard Agent call', severity: 'DEBUG'}
            }),
            tools: XH.llmToolService.tools,
            composer: {placeholder: 'Tell the agent what to build...'},
            onTurnComplete: message => this.onTurnComplete(message)
        });
    }

    //------------------
    // Implementation
    //------------------
    private buildSystemPrompt(): PlainObject[] {
        const {spec} = (XH.appModel as AppModel).weatherV2DashModel;
        return XH.llmChatService.buildSystemPrompt(spec);
    }

    private onTurnComplete(message: ChatMessage) {
        if (XH.llmToolService.changedDashboard(message)) XH.successToast('Dashboard updated.');
    }
}
