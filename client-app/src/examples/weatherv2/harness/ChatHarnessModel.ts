import {HoistModel, XH} from '@xh/hoist/core';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {DashSpec} from '../dash/types';
import {validateSpec, migrateSpec} from '../dash/validation';
import {LlmChatService, ChatMessage} from './LlmChatService';

/**
 * Model for the LLM chat harness — manages conversation history,
 * LLM API calls, and spec application.
 */
export class ChatHarnessModel extends HoistModel {
    @bindable userInput: string = '';
    @bindable isLoading: boolean = false;
    @observable.ref messages: ChatMessage[] = [];
    @observable.ref lastError: string = null;

    constructor() {
        super();
        makeObservable(this);
    }

    /** Send the current user input to the LLM and process the response. */
    @action
    async sendMessageAsync() {
        const {userInput} = this;
        if (!userInput.trim() || this.isLoading) return;

        // Add user message
        const userMsg: ChatMessage = {role: 'user', content: userInput.trim()};
        this.messages = [...this.messages, userMsg];
        this.userInput = '';
        this.isLoading = true;
        this.lastError = null;

        try {
            // Build system prompt with current dashboard spec
            const currentSpec = this.getCurrentSpec();
            const systemPrompt = LlmChatService.buildSystemPrompt(currentSpec);

            // Call LLM
            const {content} = await LlmChatService.generateAsync(systemPrompt, this.messages);

            // Add assistant response
            const assistantMsg: ChatMessage = {role: 'assistant', content};
            this.messages = [...this.messages, assistantMsg];

            // Try to extract and apply spec
            const spec = LlmChatService.parseSpecFromResponse(content);
            if (spec) {
                this.applySpec(spec);
            }
        } catch (e) {
            this.lastError = e.message || 'LLM request failed.';
        } finally {
            this.isLoading = false;
        }
    }

    /** Clear the conversation. */
    @action
    clearChat() {
        this.messages = [];
        this.lastError = null;
    }

    private getCurrentSpec(): DashSpec | undefined {
        try {
            const {AppModel} = require('../AppModel');
            const dashModel = AppModel.instance.weatherV2DashModel.dashCanvasModel;
            const persistable = dashModel.getPersistableState();
            return {version: 1, state: persistable?.state ?? []};
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

            const {AppModel} = require('../AppModel');
            const dashModel = AppModel.instance.weatherV2DashModel.dashCanvasModel;
            dashModel.setPersistableState({state: spec.state});
            XH.successToast('Dashboard updated from LLM response.');
        } catch (e) {
            this.lastError = `Failed to apply spec: ${e.message}`;
        }
    }
}
