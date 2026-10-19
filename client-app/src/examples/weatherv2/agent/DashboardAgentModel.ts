import {ChatModel} from '@xh/hoist-chat-kit/core';
import type {ChatFeedbackSpec} from '@xh/hoist-chat-kit/core';
import {AnthropicCodec, HoistChatTransport} from '@xh/hoist-chat-kit/transport';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import type {WeatherV2DashModel} from '../dash/WeatherV2DashModel';
import {createCatalog} from './catalog';
import {buildSystemPrompt} from './systemPrompt';

/**
 * Model for the Dashboard Agent: a conversation with Claude that builds and edits the dashboard.
 *
 * The chat streams each model call through the server's `llm/stream` relay, which forwards the
 * request to the Anthropic Messages API. The system prompt is rebuilt for every call from the live
 * dashboard, so the model sees the changes its own tools made earlier in the turn. The tools run
 * here in the browser, via `LlmToolService`.
 *
 * The agent also answers weather questions in the chat, with the generative UI components of its
 * catalog: metrics, a chart, a grid and a card.
 *
 * Each reply takes a thumbs up or down, with an optional comment on a down vote. The rating goes to
 * Hoist activity tracking, so admins can see how the agent does in the Admin Console.
 */
export class DashboardAgentModel extends HoistModel {
    @managed readonly chatModel: ChatModel;

    /** The dashboard the agent edits - owned by the AppModel. */
    readonly dashModel: WeatherV2DashModel;

    constructor(dashModel: WeatherV2DashModel) {
        super();
        this.dashModel = dashModel;
        const catalog = createCatalog();
        this.chatModel = new ChatModel({
            transport: new HoistChatTransport({
                url: 'llm/stream',
                // The prompt marks its own cache breakpoint, after its static instructions. That
                // also caches the tools, which come ahead of the system prompt.
                codec: new AnthropicCodec({
                    system: () => buildSystemPrompt(this.dashModel.spec, catalog.instructions)
                }),
                track: {category: 'WeatherV2', message: 'Dashboard Agent call', severity: 'DEBUG'}
            }),
            tools: XH.llmToolService.tools,
            catalog,
            // Each step is a model call, and counts toward the server's per-user `llmRateLimit`.
            // The system prompt carries the live spec, so the agent needs no lookup step to edit.
            // Five steps also cover a weather answer: a lookup or two, then two components.
            maxSteps: 5,
            feedback: {submitAsync: spec => this.trackFeedbackAsync(spec)}
        });
    }

    //------------------
    // Implementation
    //------------------
    /** Record a rating of a reply, with the tools the reply used - never the text of the chat. */
    private async trackFeedbackAsync({rating, comment, messageId, threadId}: ChatFeedbackSpec) {
        const tools = this.chatModel.getMessage(messageId)?.toolCalls.map(it => it.toolName) ?? [];
        XH.track({
            category: 'WeatherV2',
            message: rating
                ? `Rated Dashboard Agent reply ${rating}`
                : 'Cleared Dashboard Agent rating',
            data: {rating, comment, tools, threadId, messageId}
        });
    }
}
