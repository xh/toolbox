import {HoistModel, managed, PersistableState, TaskObserver, XH} from '@xh/hoist/core';
import {action, bindable, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {DashSpec} from '../dash/types';
import {validateSpec, migrateSpec} from '../dash/validation';
import {ChatMessage} from '../svc/LlmChatService';
import {AppModel} from '../AppModel';

/**
 * Model for the LLM chat harness — manages conversation history,
 * LLM API calls, and spec application.
 */
export class ChatHarnessModel extends HoistModel {
    @bindable userInput: string = '';
    @observable.ref messages: ChatMessage[] = [];
    @observable.ref lastError: string = null;

    @managed
    generateTask = TaskObserver.trackLast();

    constructor() {
        super();
        makeObservable(this);
    }

    /** Send the current user input to the LLM and process the response. */
    @action
    async sendMessageAsync() {
        const {userInput} = this;
        if (!userInput.trim() || this.generateTask.isPending) return;

        // Add user message
        const userMsg: ChatMessage = {role: 'user', content: userInput.trim()};
        this.messages = [...this.messages, userMsg];
        this.userInput = '';
        this.lastError = null;

        this.doGenerateAsync().linkTo(this.generateTask);
    }

    /** Clear the conversation. */
    @action
    clearChat() {
        this.messages = [];
        this.lastError = null;
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

            // Add assistant response and apply any spec — in action since we're post-await
            runInAction(() => {
                this.messages = [...this.messages, {role: 'assistant', content}];
                const spec = svc.parseSpecFromResponse(content);
                if (spec) this.applySpec(spec);
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
}
