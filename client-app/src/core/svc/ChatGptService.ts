import {HoistService, persist, XH} from '@xh/hoist/core';
import {dropRight, isEmpty, isString, last, pick, remove} from 'lodash';
import {bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {logInfo, withInfo} from '@xh/hoist/utils/js';
import type {SetOptional} from 'type-fest';

export interface GptMessage {
    role: 'system' | 'user' | 'assistant' | 'function';
    timestamp: number;
    content?: string;
    name?: string;
    function_call?: GptFnCallResponse;
    responseJson?: string;
}

export interface GptFnCallResponse {
    // Name of the function to be called.
    name: string;
    // Args to pass to function, escaped JSON string
    // ...or maybe a primitive if that's the function signature - need to check
    arguments: string;
}

export interface GptChatOptions {
    model?: GptModel;
    function_call?: GptFnCallRequest;
}

export type GptFnCallRequest = 'none' | 'auto' | {name: string};

export type GptModel = 'gpt-3.5-turbo' | 'gpt-4';

export class ChatGptService extends HoistService {
    override persistWith = {localStorageKey: 'chatGptService'};

    // Initialized from config via dedicated server call.
    // Configs are protected and not sent to all clients - the CHAT_GPT_USER role is required.
    apiKey: string;
    completionUrl: string;

    /**
     * Log of all messages sent back and forth between user and GPT.
     * Sent with each new message to provide GPT with the overall conversation / context.
     */
    @bindable.ref
    @persist
    messages: GptMessage[] = [];

    /**
     * History of recent user messages to support quick re-selection by user.
     * Persisted separately from the main message stream sent to GPT with each request.
     */
    @bindable.ref
    @persist
    userMessageHistory: string[] = [];

    get userMessages(): GptMessage[] {
        return this.messages.filter(it => it.role === 'user');
    }

    get systemMessage(): GptMessage {
        return this.messages.find(it => it.role === 'system');
    }

    get hasMessages(): boolean {
        return !isEmpty(this.messages);
    }

    @bindable
    @persist
    model = 'gpt-3.5-turbo';
    selectableModels = ['gpt-3.5-turbo', 'gpt-4'];

    @observable isInitialized = false;

    @bindable
    @persist
    sendSystemMessage = true;

    initialSystemMessage =
        'You are a professional AI assistant embedded within a custom financial reporting dashboard application created by a\n' +
        'hedge fund with headquarters in the United States. Your role is to respond to user queries with either a function call\n' +
        'that the application can run OR a message asking the user to clarify or explaining why you are unable to help.\n' +
        '\n' +
        '### Objects returned and aggregated by the application API\n' +
        '\n' +
        'The `getPortfolioPositions` function returns a list of `Position` objects. A `Position` satisfies the following\n' +
        'interface:\n' +
        '\n' +
        '```typescript\n' +
        'interface Position {\n' +
        '    id: string;\n' +
        '    name: string;\n' +
        '    pnl: number;\n' +
        '    mktVal: number;\n' +
        '    children: Position[];\n' +
        '}\n' +
        '```\n' +
        '\n' +
        'A `Position` represents an aggregate of one or more `RawPosition` objects. A `RawPosition` models a single investment\n' +
        'within a portfolio. It satisfies the following interface:\n' +
        '\n' +
        '```typescript\n' +
        'interface RawPosition {\n' +
        '    // Dimension - the trading strategy to which this position belongs. The value will be a code returned by the `findStrategies` function.\n' +
        '    strategy: string;\n' +
        "    // Dimension - the stock ticker or identifier of the position's instrument, an equity stock or other security - e.g. ['AAPL', 'GOOG', 'MSFT']\n" +
        '    symbol: string;\n' +
        "    // Dimension - the industry sector of the instrument - e.g. ['Technology', 'Healthcare', 'Energy']\n" +
        '    sector: string;\n' +
        "    // Dimension - the name of an investment fund - e.g. ['Winter Star Fund', 'Oak Mount Fund']\n" +
        '    fund: string;\n' +
        "    // Dimension - the name of the trader or portfolio manager responsible for the investment - e.g. ['Susan Major', 'Fred Corn', 'HedgeSys']\n" +
        '    trader: string;\n' +
        '    // Measure - the current value of the position, in USD.\n' +
        '    mktVal: number;\n' +
        '    // Measure - the current profit and loss of the position, in USD.\n' +
        '    pnl: number;\n' +
        '}\n' +
        '```\n' +
        '\n' +
        'The `getPortfolioPositions` function takes a list of `groupByDimensions` when aggregating results, representing\n' +
        'the field names of `RawPosition` dimensions within the portfolio data.\n' +
        '\n' +
        'Begin by introducing yourself to the user and ask them how you can help them.\n';

    functions = [
        {
            name: 'getPortfolioPositions',
            description:
                'Query a portfolio of `RawPosition` objects representing investments to return aggregated `Position` ' +
                'objects with P&L (profit and loss) and market value data, grouped by one or more specified dimensions. ' +
                'Each grouped row in the return will have the following properties: `name`, `pnl` (profit and loss), and ' +
                '`mktVal` (market value). If multiple grouping dimensions are specified, the results will be returned in ' +
                'a tree structure, where each parent group will have a `children` property containing an array of nested sub-groups. ' +
                'Many queries should be run by first finding a list of strategy codes using the `findStrategies` function, ' +
                'then passing those codes to the `strategies` parameter in this function.',
            parameters: {
                type: 'object',
                properties: {
                    groupByDimensions: {
                        description:
                            'Array of one or more dimensions by which the portfolio positions should be aggregated.',
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['fund', 'model', 'region', 'sector', 'trader', 'symbol']
                        },
                        minItems: 1,
                        uniqueItems: true
                    },
                    sortBy: {
                        description:
                            'The sort order of the returned results, by P&L or Market Value, either ascending or descending. Default is pnl|desc.',
                        type: 'string',
                        enum: ['pnl|desc', 'pnl|asc', 'mktVal|desc', 'mktVal|asc']
                    },
                    maxRows: {
                        description:
                            'The maximum number of top-level rows to return. Leave unspecified to return all available groupings.',
                        type: 'integer',
                        minimum: 1
                    },
                    strategies: {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        description:
                            'Optional list of strategy codes to filter by. Strategy codes should be first looked up via the `findStrategies` function, then used in this parameter to find suitable positions.'
                    }
                },
                required: ['groupByDimensions']
            }
        },
        {
            name: 'findStrategies',
            description:
                'Search for suitable strategy codes that can then be used in portfolio queries.',
            parameters: {
                type: 'object',
                properties: {
                    sector: {
                        type: 'string',
                        description:
                            'Optional filter by sector, the econonmic area or industry covered by a strategy. e.g. "Healthcare" or "Technology".'
                    },
                    analyst: {
                        type: 'string',
                        description:
                            'Optional filter by lead analyst, the individual person who is responsible for managing the strategy. e.g. "Susan Major".'
                    },
                    freeText: {
                        type: 'string',
                        description:
                            'Optional free text search that can be used to match across multiple strategy fields, when you are unsure which specific field or fields to filter on.'
                    }
                },
                minProperties: 1
            }
        }
    ];

    constructor() {
        super();
        makeObservable(this);

        // this.messages.forEach(msg => this.logMsg(msg));

        this.addReaction(
            {
                track: () => this.messages,
                run: msgs => {
                    this.hasMessages ? this.logMsg(last(msgs)) : logInfo('Messages cleared', this);
                }
            },
            {
                track: () => this.sendSystemMessage,
                run: () => this.clearAndReInitAsync()
            }
        );
    }

    logMsg(msg: GptMessage) {
        logInfo(`Received message: ${JSON.stringify(msg, null, 2)}`, this);
    }

    override async initAsync() {
        const conf = await XH.fetchJson({
            url: 'chatGpt/config'
        });
        this.apiKey = conf.apiKey;
        this.completionUrl = conf.completionUrl;

        if (!this.apiKey || !this.completionUrl) {
            throw XH.exception('ChatGPT configuration is missing required values.');
        }

        const {systemMessage, sendSystemMessage, initialSystemMessage, hasMessages} = this;
        if (
            (systemMessage && !sendSystemMessage) ||
            (systemMessage && systemMessage.content !== initialSystemMessage) ||
            (!systemMessage && hasMessages && sendSystemMessage)
        ) {
            this.clearHistory();
            XH.toast('System message has changed - history cleared.');
        }

        if (!this.hasMessages && this.sendSystemMessage) {
            this.sendChatAsync({
                role: 'system',
                content: this.initialSystemMessage
            })
                .thenAction(() => (this.isInitialized = true))
                .catch(e => {
                    this.isInitialized = false;
                    XH.handleException(e, {
                        message: 'Failed to initialize ChatGPTService.',
                        alertType: 'toast'
                    });
                });
        } else {
            this.isInitialized = true;
        }
    }

    // TODO - cancel any pending requests
    async clearAndReInitAsync() {
        this.clearHistory();
        await this.initAsync();
    }

    async sendChatAsync(
        message: SetOptional<GptMessage, 'timestamp'> | string,
        options: GptChatOptions = {}
    ) {
        const msgToSend: GptMessage = isString(message)
            ? {
                  role: 'user',
                  content: message,
                  timestamp: Date.now()
              }
            : {
                  timestamp: Date.now(),
                  ...message
              };

        // Push user message onto state immediately, to indicate that it's been sent.
        this.messages = [...this.messages, msgToSend];

        // And user messages to history for convenient re-selection.
        if (msgToSend.role === 'user') {
            this.updateUserMessageHistory(msgToSend.content);
        }

        console.log(this.messages.map(it => this.formatMessageForPost(it)));
        const body = {
            model: this.model,
            messages: this.messages.map(it => this.formatMessageForPost(it)),
            functions: this.functions,
            ...options
        };

        let resp;
        try {
            await withInfo('Called ChatGPT', async () => {
                resp = await XH.fetchService.postJson({
                    url: this.completionUrl,
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`
                    },
                    fetchOpts: {credentials: 'omit'},
                    body
                });
            });
        } catch (e) {
            // Unwind user message - was not successfully posted.
            this.messages = dropRight(this.messages);
            throw e;
        }

        console.debug(resp);
        if (isEmpty(resp?.choices)) throw XH.exception('GPT did not return any choices');

        const gptReplyChoice = resp.choices[0],
            gptResponse: GptMessage = {
                ...gptReplyChoice.message,
                timestamp: Date.now(),
                responseJson: JSON.stringify(resp, null, 2)
            };
        this.messages = [...this.messages, gptResponse];
    }

    // Strip any extra fields from message before sending to GPT.
    formatMessageForPost(msg: GptMessage) {
        return pick(msg, ['role', 'content', 'name', 'function_call']);
    }

    updateUserMessageHistory(msg: string) {
        const history = [...this.userMessageHistory];
        if (history.includes(msg)) {
            remove(history, it => it === msg);
        }
        history.unshift(msg);
        this.userMessageHistory = history;
    }

    removeFromMessageHistory(msg: string) {
        this.userMessageHistory = this.userMessageHistory.filter(it => it !== msg);
    }

    clearUserMessageHistory() {
        this.userMessageHistory = [];
    }

    clearHistory() {
        this.messages = [];
    }
}
