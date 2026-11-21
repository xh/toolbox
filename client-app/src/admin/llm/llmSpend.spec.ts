import {describe, expect, it} from 'vitest';
import {summarizeLlmUse} from './llmSpend';

const call = (username: string, data: object, severity = 'INFO') => ({
    username,
    msg: 'LLM call',
    severity,
    data: JSON.stringify(data)
});

describe('summarizeLlmUse', () => {
    it("sums each user's calls, tokens and refusals per app", () => {
        const rows = summarizeLlmUse([
            call('jdoe', {
                app: 'blueprintWeather',
                inputTokens: 100,
                outputTokens: 20,
                cacheReadTokens: 5,
                cacheWriteTokens: 0,
                tokens: 125
            }),
            call('jdoe', {
                app: 'blueprintWeather',
                inputTokens: 50,
                outputTokens: 10,
                cacheReadTokens: 0,
                cacheWriteTokens: 5,
                tokens: 65
            }),
            call('jdoe', {app: 'blueprintWeather', tokens: 7, error: 'boom'}, 'WARN'),
            call('jdoe', {tokens: 40}),
            {
                username: 'jdoe',
                msg: 'LLM rate limit hit',
                severity: 'WARN',
                data: JSON.stringify({app: 'blueprintWeather'})
            },
            call('asmith', {
                app: 'blueprintPortfolio',
                tokens: 300,
                inputTokens: 250,
                outputTokens: 50
            }),
            {username: 'asmith', msg: 'Something else', severity: 'INFO', data: null}
        ]);
        expect(rows).toEqual([
            {
                id: 'asmith|blueprintPortfolio',
                username: 'asmith',
                app: 'blueprintPortfolio',
                calls: 1,
                failed: 0,
                refused: 0,
                inputTokens: 250,
                outputTokens: 50,
                cacheTokens: 0,
                tokens: 300
            },
            {
                id: 'jdoe|(none)',
                username: 'jdoe',
                app: '(none)',
                calls: 1,
                failed: 0,
                refused: 0,
                inputTokens: 0,
                outputTokens: 0,
                cacheTokens: 0,
                tokens: 40
            },
            {
                id: 'jdoe|blueprintWeather',
                username: 'jdoe',
                app: 'blueprintWeather',
                calls: 3,
                failed: 1,
                refused: 1,
                inputTokens: 150,
                outputTokens: 30,
                cacheTokens: 10,
                tokens: 197
            }
        ]);
    });
});
