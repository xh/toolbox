import {HoistModel, managed, PersistableState, TaskObserver, XH} from '@xh/hoist/core';
import {action, bindable, computed, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {DashSpec} from '../dash/types';
import {validateSpec, migrateSpec} from '../dash/validation';
import {ChatMessage} from '../svc/LlmChatService';
import {AppModel} from '../AppModel';

/** A message for display, including a "thinking" placeholder state. */
export interface DisplayMessage {
    role: 'user' | 'assistant';
    content: string;
    thinking?: boolean;
}

/**
 * Model for the LLM chat harness — manages conversation history,
 * LLM API calls, spec application, and typewriter display effect.
 */
export class ChatHarnessModel extends HoistModel {
    @bindable userInput: string = '';
    @observable.ref messages: ChatMessage[] = [];
    @observable.ref lastError: string = null;

    // Typewriter effect state
    @observable typingMessageIdx: number = -1;
    @observable typingChars: number = 0;

    @managed
    generateTask = TaskObserver.trackLast();

    private _typingTimer: ReturnType<typeof setInterval> = null;

    constructor() {
        super();
        makeObservable(this);
    }

    /** Messages to render, including a thinking placeholder while awaiting LLM response. */
    @computed
    get displayMessages(): DisplayMessage[] {
        const msgs: DisplayMessage[] = this.messages.map(m => ({...m}));
        if (
            this.generateTask.isPending &&
            (msgs.length === 0 || msgs[msgs.length - 1].role === 'user')
        ) {
            msgs.push({role: 'assistant', content: '', thinking: true});
        }
        return msgs;
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
        if (!input.trim() || this.generateTask.isPending) return;

        const userMsg: ChatMessage = {role: 'user', content: input.trim()};
        this.messages = [...this.messages, userMsg];
        this.userInput = '';
        this.lastError = null;

        this.doGenerateAsync().linkTo(this.generateTask);
    }

    /** Clear the conversation. */
    @action
    clearChat() {
        this.stopTyping();
        this.messages = [];
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
        try {
            const svc = XH.llmChatService;

            // Build system prompt with current dashboard spec
            const currentSpec = this.getCurrentSpec();
            const systemPrompt = svc.buildSystemPrompt(currentSpec);

            // Call LLM
            const {content} = await svc.generateAsync(systemPrompt, this.messages);

            // Add assistant response, apply any spec, and start typewriter
            runInAction(() => {
                this.messages = [...this.messages, {role: 'assistant', content}];
                const spec = svc.parseSpecFromResponse(content);
                if (spec) this.applySpec(spec);
                this.startTyping(this.messages.length - 1, content);
            });
        } catch (e) {
            runInAction(() => {
                this.lastError = e.message || 'LLM request failed.';
            });
        }
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
