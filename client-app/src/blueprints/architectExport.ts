import type {ChatMessage, ChatModel} from '@xh/hoist-chat-kit/core';
import {
    architectConversationRecord,
    architectHarnessScenario,
    architectRecordMarkdown,
    architectTurnRecord
} from '@xh/hoist-chat-kit/genui/architect';
import type {
    ArchitectRecordOptions,
    ArchitectTurnCapture
} from '@xh/hoist-chat-kit/genui/architect';
import {downloadBlob} from '@xh/hoist/utils/js';
import {copyTextAsync} from './copyLink';

type ExportKind = 'architect.json' | 'architect.md' | 'scenario.json';

/**
 * Exports of the conversation with the Architect, whole or by turn, for people improving it: as
 * JSON records, as Markdown, and as a scenario for its llm-test harness. Tool results keep the
 * first rows of each list.
 */
export class ArchitectExports {
    constructor(
        private readonly opts: {
            chatModel: () => ChatModel;
            capture: ArchitectTurnCapture;
            systemPrompt: string;
            /** The open blueprint's name, for file names. */
            nameOf: () => string;
        }
    ) {}

    get messages(): ChatMessage[] {
        return this.opts.chatModel()?.messages ?? [];
    }

    downloadConversation(format: 'json' | 'md') {
        const record = architectConversationRecord(this.recordOptions());
        if (format === 'json') {
            this.download(JSON.stringify(record, null, 2), 'architect.json');
        } else {
            this.download(architectRecordMarkdown(record), 'architect.md');
        }
    }

    async copyLastTurnAsync() {
        const id = lastTurnId(this.messages);
        if (!id) return;
        const record = architectTurnRecord(id, this.recordOptions());
        await copyTextAsync(architectRecordMarkdown(record), 'Turn');
    }

    downloadTurn(turnId: string) {
        const record = architectTurnRecord(turnId, this.recordOptions());
        this.download(JSON.stringify(record, null, 2), 'architect.json', turnId);
    }

    /**
     * True if what the turn was sent was kept, as it is for each turn sent since the page loaded.
     * A harness scenario needs it, for its host blueprint and context.
     */
    hasContext(turnId: string): boolean {
        return !!this.opts.capture.get(turnId);
    }

    /** The turn as a harness scenario, with its host blueprint and its TypeScript, in one file. */
    downloadScenario(turnId: string) {
        const record = architectTurnRecord(turnId, this.recordOptions()),
            scenario = architectHarnessScenario(record);
        this.download(JSON.stringify(scenario, null, 2), 'scenario.json', turnId);
    }

    //------------------
    // Implementation
    //------------------
    private recordOptions(): ArchitectRecordOptions {
        const {capture, systemPrompt} = this.opts;
        return {messages: this.messages, contextOf: id => capture.get(id), systemPrompt};
    }

    private download(text: string, kind: ExportKind, turnId?: string) {
        const type = kind.endsWith('.md') ? 'text/markdown' : 'application/json',
            turn = turnId ? turnNumber(this.messages, turnId) : null;
        downloadBlob(
            new Blob([text], {type}),
            exportFileName(this.opts.nameOf(), new Date(), kind, turn)
        );
    }
}

/**
 * An export's file name: the blueprint's name, the local time to the minute, the turn's number for
 * one turn, and the kind.
 */
export function exportFileName(name: string, at: Date, kind: ExportKind, turn?: number): string {
    const slug =
            (name ?? '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '') || 'blueprint',
        pad = (n: number) => String(n).padStart(2, '0'),
        stamp =
            `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-` +
            `${pad(at.getHours())}${pad(at.getMinutes())}`;
    return `${slug}-${stamp}-${turn ? `turn${turn}-` : ''}${kind}`;
}

/** A turn's number in the conversation, from 1. */
export function turnNumber(messages: ChatMessage[], turnId: string): number {
    const users = messages.filter(it => it.role === 'user');
    return users.findIndex(it => it.id === turnId) + 1;
}

/** The turn a message belongs to: the ID of the user message at or before it, or null. */
export function turnIdOf(messages: ChatMessage[], messageId: string): string {
    const idx = messages.findIndex(it => it.id === messageId);
    for (let i = idx; i >= 0; i--) {
        if (messages[i].role === 'user') return messages[i].id;
    }
    return null;
}

/** True for a reply that ends its turn: the next message is the user's, or there is none. */
export function endsTurn(messages: ChatMessage[], messageId: string): boolean {
    const idx = messages.findIndex(it => it.id === messageId);
    if (idx < 0 || messages[idx].role === 'user') return false;
    const next = messages[idx + 1];
    return !next || next.role === 'user';
}

/** The ID of the conversation's last turn, or null for none. */
export function lastTurnId(messages: ChatMessage[]): string {
    return messages.length ? turnIdOf(messages, messages[messages.length - 1].id) : null;
}
