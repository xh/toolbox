import {describe, expect, it} from 'vitest';
import {usageBlockedReason, usageText} from './llmUsage';
import type {LlmUsage} from './llmUsage';

const usage = (over: Partial<LlmUsage> = {}): LlmUsage => ({
    unlimited: false,
    calls: 2,
    callsLeft: 18,
    tokens: 12_345,
    tokensLeft: null,
    paused: false,
    canCall: true,
    ...over
});

describe('llmUsage', () => {
    it('shows what is left, omitting a limit that is off', () => {
        expect(usageText(usage())).toBe('18 calls left this hour');
        expect(usageText(usage({tokensLeft: 87_655}))).toBe(
            '18 calls left this hour, 87.7k tokens left today'
        );
        expect(usageText(usage({unlimited: true, callsLeft: null}))).toBeNull();
        expect(usageText(null)).toBeNull();
    });

    it('blocks sending only when the server says no more calls, and says why', () => {
        expect(usageBlockedReason(usage())).toBeNull();
        expect(usageBlockedReason(null)).toBeNull();
        expect(usageBlockedReason(usage({canCall: false, paused: true}))).toBe(
            'The assistant demo has paused for today. Try again tomorrow.'
        );
        expect(usageBlockedReason(usage({canCall: false, tokensLeft: 0}))).toBe(
            "You have used today's assistant tokens. Try again tomorrow."
        );
        expect(usageBlockedReason(usage({canCall: false, callsLeft: 0}))).toBe(
            "You have reached this hour's assistant requests. Try again later."
        );
    });
});
