import {HoistModel, managed, PersistableState, TaskObserver, XH} from '@xh/hoist/core';
import {action, bindable, computed, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {DashSpec} from '../dash/types';
import {validateSpec, migrateSpec} from '../dash/validation';
import {ChatMessage, ContentBlock} from '../svc/LlmChatService';
import {AppModel} from '../AppModel';

/** Tool call info for display in the chat UI. */
export interface ToolCallDisplay {
    name: string;
    input: Record<string, any>;
    result: string;
    isError: boolean;
}

/** A message for display, including a "thinking" placeholder state. */
export interface DisplayMessage {
    role: 'user' | 'assistant';
    content: string;
    thinking?: boolean;
    toolCalls?: ToolCallDisplay[];
    /** Elapsed time in ms for the full LLM generate cycle (including tool loops). */
    elapsedMs?: number;
}

/** Max tool-use loop iterations to prevent runaway. */
const MAX_TOOL_ITERATIONS = 5;

/**
 * Model for the LLM chat harness — manages conversation history,
 * LLM API calls, tool execution, spec application, and typewriter display effect.
 */
export class ChatHarnessModel extends HoistModel {
    @bindable userInput: string = '';
    @observable.ref messages: ChatMessage[] = [];
    @observable.ref displayMessages: DisplayMessage[] = [];
    @observable.ref lastError: string = null;

    // Typewriter effect state
    @observable typingMessageIdx: number = -1;
    @observable typingChars: number = 0;

    @managed
    generateTask = TaskObserver.trackLast();

    private _typingTimer: ReturnType<typeof setInterval> = null;
    // Synchronous guard against concurrent sends — complements the MobX-based
    // generateTask.isPending check which can miss rapid-fire calls from the
    // same tick due to batching.
    private _isGenerating = false;

    constructor() {
        super();
        makeObservable(this);
    }

    /**
     * Get displayed content for a message, accounting for typewriter effect.
     * Call with the formatted (JSON-stripped) content, not the raw LLM text.
     */
    getDisplayContent(index: number, formattedContent: string): string {
        if (index === this.typingMessageIdx && this.typingChars < formattedContent.length) {
            return formattedContent.slice(0, this.typingChars);
        }
        return formattedContent;
    }

    /** Whether the typewriter effect is currently animating. */
    @computed
    get isTyping(): boolean {
        return this.typingMessageIdx >= 0;
    }

    /** Send the current user input (or provided text) to the LLM. */
    @action
    async sendMessageAsync(content?: string) {
        const input = content ?? this.userInput;
        if (!input.trim() || this._isGenerating) return;
        this._isGenerating = true;

        const userMsg: ChatMessage = {role: 'user', content: input.trim()};
        this.messages = [...this.messages, userMsg];
        this.rebuildDisplayMessages();
        this.userInput = '';
        this.lastError = null;

        this.doGenerateAsync()
            .finally(() => (this._isGenerating = false))
            .linkTo(this.generateTask);
    }

    /** Retry the last user message after an error. */
    @action
    retryLastAsync() {
        if (!this.lastError || this._isGenerating) return;
        this._isGenerating = true;
        this.lastError = null;
        this.doGenerateAsync()
            .finally(() => (this._isGenerating = false))
            .linkTo(this.generateTask);
    }

    /** Pop the last user message back into the input for editing after an error. */
    @action
    editLast() {
        if (!this.lastError || this.generateTask.isPending) return;
        const msgs = this.messages;
        if (msgs.length && msgs[msgs.length - 1].role === 'user') {
            const lastContent = msgs[msgs.length - 1].content;
            this.userInput = typeof lastContent === 'string' ? lastContent : '';
            this.messages = msgs.slice(0, -1);
            this.rebuildDisplayMessages();
        }
        this.lastError = null;
    }

    /** Clear the conversation. */
    @action
    clearChat() {
        this.stopTyping();
        this.messages = [];
        this.displayMessages = [];
        this.lastError = null;
    }

    override destroy() {
        this.stopTyping();
        super.destroy();
    }

    //------------------
    // Implementation
    //------------------
    private async doGenerateAsync() {
        const startTime = Date.now();
        try {
            const chatSvc = XH.llmChatService,
                toolSvc = XH.llmToolService;

            const currentSpec = this.getCurrentSpec();
            const systemPrompt = chatSvc.buildSystemPrompt(currentSpec);
            const tools = toolSvc.getToolDefinitions();

            // Accumulate tool calls across iterations for display
            const allToolCalls: ToolCallDisplay[] = [];
            let allTextParts: string[] = [];

            // Tool use loop: call LLM, execute any tools, send results back
            for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
                const {content} = await chatSvc.generateAsync(systemPrompt, this.messages, tools);

                // Append assistant message with full content blocks to API history
                runInAction(() => {
                    this.messages = [...this.messages, {role: 'assistant', content}];
                });

                // Collect text parts from this response
                const textParts = content.filter(b => b.type === 'text' && b.text).map(b => b.text);
                allTextParts.push(...textParts);

                // Check for tool use blocks — break if none
                const toolUseBlocks = content.filter(b => b.type === 'tool_use');
                if (toolUseBlocks.length === 0) break;

                // Execute each tool and collect results
                const toolResults: ContentBlock[] = [];
                for (const block of toolUseBlocks) {
                    const {content: result, isError} = await toolSvc.executeToolAsync(
                        block.name,
                        block.input
                    );
                    allToolCalls.push({
                        name: block.name,
                        input: block.input,
                        result,
                        isError
                    });
                    toolResults.push({
                        type: 'tool_result',
                        tool_use_id: block.id,
                        content: result,
                        is_error: isError
                    });
                }

                // Send tool results back as a user message
                runInAction(() => {
                    this.messages = [...this.messages, {role: 'user', content: toolResults}];
                });
            }

            // Build final display text from all text parts
            const finalText = allTextParts.join('\n\n');

            runInAction(() => {
                // Parse and apply any spec from the combined text
                const spec = chatSvc.parseSpecFromResponse(finalText);
                if (spec) this.applySpec(spec);

                // Add display message with tool calls + text + elapsed time
                const elapsedMs = Date.now() - startTime;
                this.displayMessages = [
                    ...this.displayMessages,
                    {
                        role: 'assistant',
                        content: finalText,
                        toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
                        elapsedMs
                    }
                ];

                this.startTyping(this.displayMessages.length - 1, finalText);
            });
        } catch (e) {
            runInAction(() => {
                this.lastError = e.message || 'LLM request failed.';
            });
        }
    }

    /**
     * Rebuild displayMessages from the API messages array.
     * Called when user messages are added/removed (send, edit).
     * Only processes user messages — assistant display messages are added
     * by doGenerateAsync after the full tool loop completes.
     */
    @action
    private rebuildDisplayMessages() {
        const display: DisplayMessage[] = [];
        for (const msg of this.messages) {
            if (msg.role === 'user' && typeof msg.content === 'string') {
                display.push({role: 'user', content: msg.content});
            }
            // Assistant display messages and tool-result user messages are not
            // rebuilt here — they're managed by doGenerateAsync.
        }

        // Preserve existing assistant display messages by interleaving:
        // Walk through existing displayMessages to keep assistant entries intact.
        const existing = this.displayMessages;
        const merged: DisplayMessage[] = [];
        let userIdx = 0;
        const userMsgs = display;

        for (const dm of existing) {
            if (dm.role === 'user') {
                if (userIdx < userMsgs.length) {
                    merged.push(userMsgs[userIdx++]);
                }
            } else {
                merged.push(dm);
            }
        }
        // Append any remaining new user messages
        while (userIdx < userMsgs.length) {
            merged.push(userMsgs[userIdx++]);
        }

        this.displayMessages = merged;
    }

    private getCurrentSpec(): DashSpec | undefined {
        try {
            const dashModel = AppModel.instance.weatherV2DashModel.dashCanvasModel;
            const persistable = dashModel.getPersistableState();
            return {version: 1, state: persistable?.value?.state ?? []};
        } catch {
            return undefined;
        }
    }

    @action
    private applySpec(rawSpec: DashSpec) {
        try {
            const spec = migrateSpec(rawSpec);
            const result = validateSpec(spec);

            if (!result.valid) {
                const errorSummary = result.errors.map(e => e.message).join('; ');
                this.lastError = `Spec validation failed: ${errorSummary}`;
                return;
            }

            const dashModel = AppModel.instance.weatherV2DashModel.dashCanvasModel;
            dashModel.setPersistableState(new PersistableState({state: spec.state}));
            XH.successToast('Dashboard updated from LLM response.');
        } catch (e) {
            this.lastError = `Failed to apply spec: ${e.message}`;
        }
    }

    //------------------
    // Typewriter
    //------------------
    @action
    private startTyping(index: number, rawContent: string) {
        this.stopTyping();
        const formatted = formatMessageContent(rawContent);
        // Skip animation for very short messages
        if (formatted.length < 30) return;

        this.typingMessageIdx = index;
        this.typingChars = 0;

        // Target ~1.2s total animation; tick every 12ms
        const charsPerTick = Math.max(3, Math.ceil(formatted.length / 100));
        this._typingTimer = setInterval(() => {
            runInAction(() => {
                this.typingChars += charsPerTick;
                if (this.typingChars >= formatted.length) {
                    this.stopTyping();
                }
            });
        }, 12);
    }

    private stopTyping() {
        if (this._typingTimer) {
            clearInterval(this._typingTimer);
            this._typingTimer = null;
        }
        if (this.typingMessageIdx >= 0) {
            runInAction(() => {
                this.typingMessageIdx = -1;
                this.typingChars = 0;
            });
        }
    }
}

/**
 * Format a message content string, stripping JSON code fences for cleaner display.
 * Exported for use by both model (typewriter length) and panel (render).
 */
export function formatMessageContent(content: string): string {
    return content.replace(/```json[\s\S]*?```/g, '[Dashboard spec applied]').trim();
}
