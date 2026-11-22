import type {BlueprintModel, BlueprintOp} from '@xh/hoist-chat-kit/blueprint';
import {architectPrompt} from '@xh/hoist-chat-kit/blueprint';
import {ChatModel} from '@xh/hoist-chat-kit/core';
import type {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import {architectChatTools, blueprintContextProvider} from '@xh/hoist-chat-kit/genui/architect';
import type {FeatureRequestSink} from '@xh/hoist-chat-kit/genui/architect';
import {AnthropicCodec, HoistChatTransport} from '@xh/hoist-chat-kit/transport';
import type {PlainObject} from '@xh/hoist/core';
import {withEditCards} from './editor/architectEditCard';

/**
 * The Architect: a chat with Claude, relayed by Toolbox's `llm/stream`, that edits the blueprint
 * through chat kit's Architect tools, run in the browser against `blueprintModel`, and answers
 * questions with blueprints of their own through `show_ui`.
 *
 * @param onSave - called as each turn ends or pauses, to store the conversation.
 * @param context - what each call is for, sent as `X-Llm-Context` for the server's tracking.
 * @param sendBlocker - why the user may not send now, or null.
 * @param featureRequests - where the Architect's feature requests go.
 * @param onShowEdit - selects what an edit touched, from Show on its card in the reply.
 */
export function createArchitectChat(
    blueprintModel: BlueprintModel,
    catalog: ChatUiCatalog,
    onSave: () => void,
    context: () => PlainObject,
    sendBlocker: () => string,
    featureRequests: FeatureRequestSink,
    onShowEdit: (ops: BlueprintOp[]) => void
): ChatModel {
    return new ChatModel({
        transport: new HoistChatTransport({
            url: 'llm/stream',
            headers: () => ({'X-Llm-Context': JSON.stringify(context())}),
            codec: new AnthropicCodec({
                system: architectPrompt({
                    catalogs: blueprintModel.catalogs,
                    registry: catalog.registry,
                    withAnswers: true,
                    withFeatureRequests: true
                }),
                cacheControl: true
            })
        }),
        catalog,
        tools: withEditCards(
            architectChatTools(blueprintModel, {catalog, featureRequests}),
            blueprintModel,
            onShowEdit
        ),
        contextProviders: [blueprintContextProvider(blueprintModel)],
        // Each step is a model call, and counts toward the server's per-user `llmRateLimit`.
        maxSteps: 12,
        sendBlocker,
        onTurnComplete: onSave,
        onTurnPause: onSave
    });
}
