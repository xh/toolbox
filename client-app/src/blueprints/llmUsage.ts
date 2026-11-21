/** The signed-in user's use of the Claude API relay, as `llm/usage` reports it. */
export interface LlmUsage {
    unlimited: boolean;
    /** Model calls in the last hour. */
    calls: number;
    /** Calls left this hour, or null for no limit. */
    callsLeft: number;
    /** Tokens used today. */
    tokens: number;
    /** Tokens left today, or null for no limit. */
    tokensLeft: number;
    /** True once the app's daily budget is spent. */
    paused: boolean;
    canCall: boolean;
}

/** What is left of the user's limits, such as "18 calls left this hour", or null if unlimited. */
export function usageText(usage: LlmUsage): string {
    if (!usage) return null;
    const {callsLeft, tokensLeft} = usage,
        parts = [
            callsLeft != null ? `${callsLeft} calls left this hour` : null,
            tokensLeft != null ? `${fmtTokens(tokensLeft)} tokens left today` : null
        ].filter(Boolean);
    return parts.length ? parts.join(', ') : null;
}

/** Why the user may not call the model now, or null if they may. */
export function usageBlockedReason(usage: LlmUsage): string {
    if (!usage || usage.canCall) return null;
    if (usage.paused) return 'The assistant demo has paused for today. Try again tomorrow.';
    if (usage.tokensLeft === 0)
        return "You have used today's assistant tokens. Try again tomorrow.";
    return "You have reached this hour's assistant requests. Try again later.";
}

function fmtTokens(n: number): string {
    return n < 1000 ? String(n) : `${(n / 1000).toFixed(1)}k`;
}
