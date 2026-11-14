import type {ChatMessage} from '@xh/hoist-chat-kit/core';
import {ChatModel} from '@xh/hoist-chat-kit/core';
import type {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import {AnthropicCodec, HoistChatTransport} from '@xh/hoist-chat-kit/transport';
import {HoistModel, managed} from '@xh/hoist/core';
import {observableRef} from '@xh/hoist/mobx';
import {findLast} from 'lodash';
import {createOpenUiLabCatalog, OPEN_UI_FORMAT_OPTIONS} from './OpenUiLabCatalog';
import {createOpenUiLabTools} from './OpenUiLabTools';
import type {OpenUiProgramReport} from './OpenUiProgramReport';
import {OpenUiProgramInspector} from './OpenUiProgramReport';
import {createOpenUiReplayTransport} from './OpenUiReplay';

/** Where a lab page gets its replies. */
export type OpenUiLabSource = 'live' | 'replay';

/**
 * The model of an OpenUI Lab page: a chat whose replies hold OpenUI Lang, and the reports on each
 * program of its latest reply, for the inspector.
 *
 * A `live` page asks Claude through the Toolbox server relay. A `replay` page streams scripted
 * replies, and any text the user sends, with no model. Both use the same catalog and data tools.
 */
export class OpenUiLabModel extends HoistModel {
    readonly source: OpenUiLabSource;

    readonly catalog: ChatUiCatalog = createOpenUiLabCatalog();

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

    private readonly inspector = new OpenUiProgramInspector(this.catalog, OPEN_UI_FORMAT_OPTIONS);

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
            tools: createOpenUiLabTools(),
            catalog: this.catalog,
            // Each step of a live reply is a model call, and counts toward the server's per-user
            // rate limit. A reply that calls data tools takes a step per round of calls, then
            // one to write its answer.
            maxSteps: 6
        });

        // The chat replaces a streaming message on every chunk. Each report parses its program
        // from the start, so follow the stream at a short delay.
        this.addReaction({
            track: () => findLast(this.chatModel.messages, it => it.isAssistant) ?? null,
            run: message => {
                this.inspectedMessage = message;
                this.reports = this.inspector.inspectMessage(message);
            },
            debounce: 150
        });
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
