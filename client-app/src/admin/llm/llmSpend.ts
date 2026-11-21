import type {PlainObject} from '@xh/hoist/core';
import {sortBy} from 'lodash';

/** One user's use of the Claude API relay in one app, summed over the track entries given. */
export interface LlmSpendRow {
    id: string;
    username: string;
    /** The client app that made the calls, or `(none)` where it sent no context. */
    app: string;
    calls: number;
    /** Calls that ended in an error. */
    failed: number;
    /** Requests the server refused, for a limit or the budget. */
    refused: number;
    inputTokens: number;
    outputTokens: number;
    /** Cache reads and writes. */
    cacheTokens: number;
    /** Every token the calls used, as the server counts them toward its limits. */
    tokens: number;
}

/** Sum `LLM` track entries per user and app. Entries of other messages are ignored. */
export function summarizeLlmUse(logs: PlainObject[]): LlmSpendRow[] {
    const byKey = new Map<string, LlmSpendRow>();
    logs.forEach(log => {
        const {msg, username, severity} = log,
            isCall = msg === 'LLM call',
            isRefusal = !isCall && REFUSALS.includes(msg);
        if (!isCall && !isRefusal) return;

        const data = parse(log.data),
            app = data.app ?? '(none)',
            id = `${username}|${app}`,
            row = byKey.get(id) ?? {
                id,
                username,
                app,
                calls: 0,
                failed: 0,
                refused: 0,
                inputTokens: 0,
                outputTokens: 0,
                cacheTokens: 0,
                tokens: 0
            };
        byKey.set(id, row);
        if (isRefusal) {
            row.refused++;
            return;
        }
        row.calls++;
        if (severity === 'WARN') row.failed++;
        row.inputTokens += data.inputTokens ?? 0;
        row.outputTokens += data.outputTokens ?? 0;
        row.cacheTokens += (data.cacheReadTokens ?? 0) + (data.cacheWriteTokens ?? 0);
        row.tokens += data.tokens ?? 0;
    });
    return sortBy([...byKey.values()], ['username', 'app']);
}

const REFUSALS = [
    'LLM rate limit hit',
    'LLM token limit hit',
    'LLM token budget reached',
    'LLM request refused'
];

function parse(data: unknown): PlainObject {
    if (!data) return {};
    if (typeof data !== 'string') return data as PlainObject;
    try {
        return JSON.parse(data) ?? {};
    } catch {
        return {};
    }
}
