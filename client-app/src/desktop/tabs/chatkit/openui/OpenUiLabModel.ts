import type {ChatMessage, ChatToolSpec} from '@xh/hoist-chat-kit/core';
import {ChatModel} from '@xh/hoist-chat-kit/core';
import type {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import type {OpenUiToolCall} from '@xh/hoist-chat-kit/genui/openui';
import {AnthropicCodec, HoistChatTransport} from '@xh/hoist-chat-kit/transport';
import {HoistModel, managed} from '@xh/hoist/core';
import {action, observableRef} from '@xh/hoist/mobx';
import {findLast} from 'lodash';
import {createOpenUiLabCatalog} from './OpenUiLabCatalog';
import {createOpenUiLabTools, toOpenUiQueryTools} from './OpenUiLabTools';
import type {OpenUiProgramReport} from './OpenUiProgramReport';
import {inspectOpenUiMessage} from './OpenUiProgramReport';
import {createOpenUiReplayTransport} from './OpenUiReplay';

/** Where a lab page gets its replies. */
export type OpenUiLabSource = 'live' | 'replay';

/** One call to a data tool, for the inspector's call log. */
export interface OpenUiLabToolCall extends OpenUiToolCall {
    /** Position of the call in the log, from 1. */
    index: number;
    /** Epoch millis when the lab first saw the call. */
    at: number;
    /** Who made the call: the model in a reply, or a program with `Query()`. */
    by: 'model' | 'program';
}

/**
 * The model of an OpenUI Lab page: a chat whose replies hold OpenUI Lang, and what the inspector
 * shows of them - a report on each program of the latest reply, and a log of the tool calls that
 * the model and its programs made.
 *
 * A `live` page asks Claude through the Toolbox server relay. A `replay` page streams scripted
 * replies, and any text the user sends, with no model. Both use the same catalog and data tools.
 */
export class OpenUiLabModel extends HoistModel {
    readonly source: OpenUiLabSource;

    /**
     * The data tools. The model calls them in a reply, and a program calls them with `Query()`,
     * so the catalog lists them as query tools. All three only read sample data.
     */
    readonly tools: ChatToolSpec[] = createOpenUiLabTools();

    readonly catalog: ChatUiCatalog = createOpenUiLabCatalog({
        queryTools: toOpenUiQueryTools(this.tools),
        onToolCall: call => this.logToolCall(call, 'program')
    });

    /**
     * The system prompt of the live page: the app's own text, then the catalog's OpenUI Lang
     * section. A replay sends no prompt.
     */
    readonly systemPrompt = `${APP_PROMPT}\n\n${this.catalog.instructions}`;

    @managed readonly chatModel: ChatModel;

    /** The reply that the inspector reports on: the latest one from the model. */
    @observableRef accessor inspectedMessage: ChatMessage = null;

    /** A report per OpenUI Lang program of the inspected reply. */
    @observableRef accessor reports: OpenUiProgramReport[] = [];

    /**
     * Each call to a data tool in this chat, oldest first: those the model made in a reply, and
     * those a program started with `Query()`. A `Query()` call is not part of the chat's history,
     * so this log is its only trace.
     */
    @observableRef accessor toolCalls: OpenUiLabToolCall[] = [];

    // Keys of the model's calls already in the log, so that each shows once.
    private readonly loggedModelCalls = new Set<string>();

    constructor(source: OpenUiLabSource) {
        super();
        this.source = source;
        this.chatModel = new ChatModel({
            transport:
                source === 'live'
                    ? new HoistChatTransport({
                          url: 'llm/stream',
                          codec: new AnthropicCodec({system: this.systemPrompt, cacheControl: true})
                      })
                    : createOpenUiReplayTransport(),
            tools: this.tools,
            catalog: this.catalog,
            // Each step of a live reply is a model call, and counts toward the server's per-user
            // rate limit. A reply that calls data tools takes a step per round of calls, then
            // one to write its answer.
            maxSteps: 6
        });

        // The chat replaces a streaming message on every chunk, so follow the stream at a short
        // delay.
        this.addReaction({
            track: () => findLast(this.chatModel.messages, it => it.isAssistant) ?? null,
            run: message => {
                this.inspectedMessage = message;
                this.reports = inspectOpenUiMessage(this.catalog, message);
            },
            debounce: 150
        });

        // The model's own calls are parts of its replies. Log each once its arguments are complete.
        this.addReaction({
            track: () => this.chatModel.messages,
            run: messages => this.logModelCalls(messages)
        });

        // A cleared chat starts its log again.
        this.addReaction({
            track: () => this.chatModel.isEmpty,
            run: isEmpty => {
                if (!isEmpty) return;
                this.toolCalls = [];
                this.loggedModelCalls.clear();
            }
        });
    }

    /** Empty the inspector's call log. */
    @action
    clearToolCalls() {
        this.toolCalls = [];
    }

    //------------------
    // Implementation
    //------------------
    @action
    private logToolCall(call: OpenUiToolCall, by: OpenUiLabToolCall['by']) {
        const {toolCalls} = this;
        this.toolCalls = [...toolCalls, {...call, by, index: toolCalls.length + 1, at: Date.now()}];
    }

    private logModelCalls(messages: ChatMessage[]) {
        const {loggedModelCalls} = this;
        messages.forEach(message =>
            message.toolCalls.forEach(({id, toolName, input, state}) => {
                const key = `${message.id}:${id}`;
                if (state === 'input-streaming' || loggedModelCalls.has(key)) return;
                loggedModelCalls.add(key);
                this.logToolCall({toolName, args: input ?? {}, messageId: message.id}, 'model');
            })
        );
    }
}

//------------------
// Implementation
//------------------
const APP_PROMPT = [
    'You are the assistant of the OpenUI Lab, a page of the Chat Kit tab in Toolbox, the demo app',
    'for the Hoist framework by Extremely Heavy Industries (XH). The lab tests how well a model',
    'can answer with UI.',
    '',
    'Your tools read the sample trading portfolio that Toolbox serves: positions, trades and',
    'daily prices. The figures are generated sample data, not real holdings. Keep prose short.'
].join('\n');
