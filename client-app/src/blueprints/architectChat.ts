import type {BlueprintModel} from '@xh/hoist-chat-kit/blueprint';
import {architectPrompt} from '@xh/hoist-chat-kit/blueprint';
import {ChatModel} from '@xh/hoist-chat-kit/core';
import type {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import {architectChatTools, blueprintContextProvider} from '@xh/hoist-chat-kit/genui/architect';
import {AnthropicCodec, HoistChatTransport} from '@xh/hoist-chat-kit/transport';
import type {PlainObject} from '@xh/hoist/core';

/**
 * The Architect: a chat with Claude, relayed by Toolbox's `llm/stream`, that edits the blueprint
 * through chat kit's Architect tools, run in the browser against `blueprintModel`, and answers
 * questions with blueprints of their own through `show_ui`.
 *
 * @param onSave - called as each turn ends or pauses, to store the conversation.
 * @param context - what each call is for, sent as `X-Llm-Context` for the server's tracking.
 * @param sendBlocker - why the user may not send now, or null.
 */
export function createArchitectChat(
    blueprintModel: BlueprintModel,
    catalog: ChatUiCatalog,
    onSave: () => void,
    context: () => PlainObject,
    sendBlocker: () => string
): ChatModel {
    return new ChatModel({
        transport: new HoistChatTransport({
            url: 'llm/stream',
            headers: () => ({'X-Llm-Context': JSON.stringify(context())}),
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
        tools: architectChatTools(blueprintModel, {catalog}),
        contextProviders: [blueprintContextProvider(blueprintModel)],
        // Each step is a model call, and counts toward the server's per-user `llmRateLimit`.
        maxSteps: 12,
        sendBlocker,
        onTurnComplete: onSave,
        onTurnPause: onSave
    });
}
