import {ChatModel} from '@xh/hoist-chat-kit/core';
import {AnthropicCodec, HoistChatTransport} from '@xh/hoist-chat-kit/transport';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import type {WeatherV2DashModel} from '../dash/WeatherV2DashModel';
import {buildSystemPrompt} from './systemPrompt';

/**
 * Model for the Dashboard Agent: a conversation with Claude that builds and edits the dashboard.
 *
 * The chat streams each model call through the server's `llm/stream` relay, which forwards the
 * request to the Anthropic Messages API. The system prompt is rebuilt for every call from the live
 * dashboard, so the model sees the changes its own tools made earlier in the turn. The tools run
 * here in the browser, via `LlmToolService`.
 */
export class DashboardAgentModel extends HoistModel {
    @managed readonly chatModel: ChatModel;

    /** The dashboard the agent edits - owned by the AppModel. */
    readonly dashModel: WeatherV2DashModel;

    constructor(dashModel: WeatherV2DashModel) {
        super();
        this.dashModel = dashModel;
        this.chatModel = new ChatModel({
            transport: new HoistChatTransport({
                url: 'llm/stream',
                // The prompt marks its own cache breakpoint, after its static instructions. That
                // also caches the tools, which come ahead of the system prompt.
                codec: new AnthropicCodec({system: () => buildSystemPrompt(this.dashModel.spec)}),
                track: {category: 'WeatherV2', message: 'Dashboard Agent call', severity: 'DEBUG'}
            }),
            tools: XH.llmToolService.tools
        });
    }
}
