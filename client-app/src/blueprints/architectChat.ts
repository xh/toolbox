import type {BlueprintDesignModel, BlueprintModel, BlueprintOp} from '@xh/hoist-chat-kit/blueprint';
import {architectPrompt} from '@xh/hoist-chat-kit/blueprint';
import {ChatModel} from '@xh/hoist-chat-kit/core';
import type {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import {
    architectChatTools,
    blueprintContextProvider,
    uiContextProvider
} from '@xh/hoist-chat-kit/genui/architect';
import type {ArchitectTurnCapture, FeatureRequestSink} from '@xh/hoist-chat-kit/genui/architect';
import {AnthropicCodec, HoistChatTransport} from '@xh/hoist-chat-kit/transport';
import type {PlainObject} from '@xh/hoist/core';
import {withEditCards} from './editor/architectEditCard';

/** What {@link createArchitectChat} builds the Architect's chat from. */
export interface ArchitectChatConfig {
    blueprintModel: BlueprintModel;
    /**
     * The designer beside the chat, whose selection, mode and active tabs each step tells the
     * Architect, so a request can name "the selected widget".
     */
    designModel: BlueprintDesignModel;
    catalog: ChatUiCatalog;
    /** The Architect's system prompt, from {@link architectSystemPrompt}. */
    systemPrompt: string;
    /** Keeps what each turn is sent, for its export. */
    capture: ArchitectTurnCapture;
    /** Called as each turn ends or pauses, to store the conversation. */
    onSave: () => void;
    /** What each call is for, sent as `X-Llm-Context` for the server's tracking. */
    context: () => PlainObject;
    /** Why the user may not send now, or null. */
    sendBlocker: () => string;
    /** Where the Architect's feature requests go. */
    featureRequests: FeatureRequestSink;
    /** Selects what an edit touched, from Show on its card in the reply. */
    onShowEdit: (ops: BlueprintOp[]) => void;
}

/** The Architect's system prompt, over the blueprint's catalogs and the chat's registry. */
export function architectSystemPrompt(blueprintModel: BlueprintModel, catalog: ChatUiCatalog) {
    return architectPrompt({
        catalogs: blueprintModel.catalogs,
        registry: catalog.registry,
        withAnswers: true,
        withFeatureRequests: true,
        withUiContext: true
    });
}

/**
 * The Architect: a chat with Claude, relayed by Toolbox's `llm/stream`, that edits the blueprint
 * through chat kit's Architect tools, run in the browser against `blueprintModel`, and answers
 * questions with blueprints of their own through `show_ui`.
 */
export function createArchitectChat(config: ArchitectChatConfig): ChatModel {
    const {blueprintModel, designModel, catalog, capture} = config;
    return new ChatModel({
        transport: new HoistChatTransport({
            url: 'llm/stream',
            headers: () => ({'X-Llm-Context': JSON.stringify(config.context())}),
            codec: new AnthropicCodec({system: config.systemPrompt, cacheControl: true})
        }),
        catalog,
        tools: withEditCards(
            architectChatTools(blueprintModel, {catalog, featureRequests: config.featureRequests}),
            blueprintModel,
            config.onShowEdit
        ),
        contextProviders: capture.wrap([
            blueprintContextProvider(blueprintModel),
            uiContextProvider(designModel)
        ]),
        // Each step is a model call, and counts toward the server's per-user `llmRateLimit`.
        maxSteps: 12,
        sendBlocker: config.sendBlocker,
        onTurnComplete: config.onSave,
        onTurnPause: config.onSave
    });
}
