import type {ChatMessageSpec, ChatToolCallPart, ChatToolSpec} from '@xh/hoist-chat-kit/core';
import type {ChatScopeChipProps, ChatSuggestion} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import type {
    ChatRunRequest,
    ScriptedItem,
    ScriptedRequestContext
} from '@xh/hoist-chat-kit/transport';
import {
    errorEvents,
    scriptedDelay,
    sourceEvents,
    textEvents,
    toolCallEvents
} from '@xh/hoist-chat-kit/transport';
import {Icon} from '@xh/hoist/icon';
import {last} from 'lodash';
import {createSampleConversation} from '../common/sampleConversation';
import {markdown} from '../common/ChatDemoUtils';
import type {LocalThread} from './LocalThreadStore';

/**
 * Sample content for the Threads & Workspace page: the seed threads, the scripted replies of a
 * research assistant, the documents its replies cite, and the sources the user can scope a
 * question to. Everything here is made up, in a neutral fixed income domain.
 */

//------------------------------------------------------------------
// Sources to search - the composer's scope chip
//------------------------------------------------------------------
export const SOURCE_OPTIONS: ChatScopeChipProps['options'] = [
    {id: 'policies', name: 'Investment policies', icon: Icon.fileText()},
    {id: 'minutes', name: 'Committee minutes', icon: Icon.users()},
    {id: 'research', name: 'Rates research', icon: Icon.chartLine()},
    {id: 'positions', name: 'Positions and risk', icon: Icon.database()},
    {id: 'news', name: 'Market news', icon: Icon.globe()}
];

export const ALL_SOURCE_IDS = SOURCE_OPTIONS.map(it => it.id);

//------------------------------------------------------------------
// Prompts for a new chat - one per scripted reply
//------------------------------------------------------------------
export const SUGGESTIONS: ChatSuggestion[] = [
    {
        text: 'Run a rate stress test on the core portfolio',
        description: 'A slow agent run. Switch chats while it works.',
        icon: Icon.gauge()
    },
    {
        text: 'What does our policy say about duration?',
        description: 'Cites two documents. Click a marker to open one.',
        icon: Icon.fileText()
    },
    {
        text: 'Which sources cover credit spreads?',
        description: 'Answers from the sources picked in the composer.',
        icon: Icon.database()
    },
    {
        text: 'Simulate a failed reply',
        description: 'Fails partway, with Try Again.',
        icon: Icon.warning()
    }
];

/** Display specs for the backend tools the slow reply calls. */
export const TOOLS: ChatToolSpec[] = [
    {
        name: 'load_positions',
        displayName: 'Load positions',
        icon: Icon.database(),
        display: 'timeline',
        summary: (part: ChatToolCallPart) => part.input?.portfolio as string
    },
    {
        name: 'run_scenario',
        displayName: 'Run scenario',
        icon: Icon.gauge(),
        display: 'timeline',
        summary: (part: ChatToolCallPart) => part.input?.shock as string
    },
    {
        name: 'aggregate_results',
        displayName: 'Aggregate results',
        icon: Icon.calculator(),
        display: 'timeline'
    }
];

//------------------------------------------------------------------
// Scripted replies
//------------------------------------------------------------------
/** The reply to a question, picked by keywords in the user's message. */
export function createReply(
    request: ChatRunRequest,
    context: ScriptedRequestContext
): ScriptedItem[] {
    const text = (context.userMessage ?? last(request.newMessages))?.text?.toLowerCase() ?? '',
        sourceIds: string[] = request.runOptions?.sourceIds ?? ALL_SOURCE_IDS;

    if (/stress|scenario|shock/.test(text)) return createStressTestReply();
    if (/policy|duration|document|minutes/.test(text)) return createPolicyReply();
    if (/fail|error|outage/.test(text)) return createFailedReply();
    return createScopedReply(sourceIds);
}

/** A slow agent run: a dozen seconds of timeline calls, so a switch leaves it in the background. */
function createStressTestReply(): ScriptedItem[] {
    const shocks = ['+100 bp parallel', '+200 bp parallel', 'Bear steepener'];
    return [
        scriptedDelay(600),
        textEvents('I will load the core positions, then run three rate scenarios against them.', {
            messageId: 'plan'
        }),
        toolCallEvents(
            'load_positions',
            {portfolio: 'Core fixed income'},
            {result: {positions: 412, marketValue: 1_840_000_000}}
        ),
        scriptedDelay(2_000),
        shocks.map(shock => toolCallEvents('run_scenario', {shock}, {result: {shock}})),
        scriptedDelay(3_500),
        toolCallEvents('aggregate_results', {by: 'sleeve'}, {result: {rows: 4}}),
        scriptedDelay(2_000),
        textEvents(
            markdown(`
                The core portfolio loses **$114m** in a +100 bp parallel shock, and twice that at
                +200 bp. The bear steepener hurts less, as most of the duration sits at 5 to 7 years.

                | Scenario | P&L | Change in value |
                |----------|----:|----------------:|
                | +100 bp parallel | -$114m | -6.2% |
                | +200 bp parallel | -$221m | -12.0% |
                | Bear steepener | -$68m | -3.7% |

                The long sleeve drives most of the loss. Trimming it by a fifth would bring the
                +200 bp loss under the $200m limit.
            `),
            {messageId: 'answer'}
        )
    ];
}

/** A reply that cites two documents, which open in the workspace's side panel. */
function createPolicyReply(): ScriptedItem[] {
    return [
        scriptedDelay(800),
        textEvents(
            markdown(`
                The policy sets a band for the core sleeve: duration must stay between **4.0 and
                7.0 years**, measured at each month end [1]. A breach must be fixed within ten
                business days, or reported to the committee.

                At its September meeting the committee chose to hold duration near **6.5 years**,
                inside the band, and to review the position in December [2].
            `),
            {chunkSize: 12}
        ),
        sourceEvents([
            {
                id: 'policy',
                sourceType: 'document',
                marker: 1,
                title: 'Fixed Income Policy 2026',
                snippet: DOCUMENTS['fi-policy'].passage,
                metadata: {
                    documentId: 'fi-policy',
                    fileName: 'Fixed Income Policy 2026.pdf',
                    page: 12
                }
            },
            {
                id: 'minutes',
                sourceType: 'document',
                marker: 2,
                title: 'Investment Committee Minutes - September',
                snippet: DOCUMENTS['committee-minutes'].passage,
                metadata: {
                    documentId: 'committee-minutes',
                    fileName: 'Committee Minutes 2026-09.pdf',
                    page: 2
                }
            }
        ])
    ];
}

/** A reply that fails partway, as a model service that times out. */
function createFailedReply(): ScriptedItem[] {
    return [
        scriptedDelay(600),
        textEvents('Pulling the latest spreads for the high yield book, then'),
        scriptedDelay(1_200),
        errorEvents('The model service did not respond in time.', 'timeout')
    ];
}

/** A short reply that names the sources the question was scoped to, from its run options. */
function createScopedReply(sourceIds: string[]): ScriptedItem[] {
    const names = SOURCE_OPTIONS.filter(it => sourceIds.includes(it.id)).map(it => it.name),
        scope = names.length
            ? `I searched ${names.length} of ${SOURCE_OPTIONS.length} sources: ${names.join(', ')}.`
            : 'No sources were picked, so this answer comes from general knowledge alone.';
    return [
        scriptedDelay(700),
        textEvents(
            markdown(`
                ${scope} Change them with the **Sources** chip in the composer. Each question
                records its picks in \`metadata.runOptions\`, and a retry runs with the same ones.

                Credit spreads come up most in **Rates research** and **Market news**. High yield
                spreads widened 35 bp this month, while investment grade held steady.
            `)
        )
    ];
}

//------------------------------------------------------------------
// Documents - for the side panel's viewer
//------------------------------------------------------------------
export interface SampleDocument {
    title: string;
    fileName: string;
    pageCount: number;
    page: number;
    /** The passage a citation points at. It appears word for word in `paragraphs`. */
    passage: string;
    paragraphs: string[];
}

export const DOCUMENTS: Record<string, SampleDocument> = {
    'fi-policy': {
        title: 'Fixed Income Policy 2026',
        fileName: 'Fixed Income Policy 2026.pdf',
        pageCount: 38,
        page: 12,
        passage:
            'Duration of the core sleeve must stay between 4.0 and 7.0 years, measured at each month end.',
        paragraphs: [
            '### 4.2 Interest rate risk',
            'The core sleeve holds investment grade government and corporate bonds. It is the largest part of the portfolio, and its interest rate risk is managed against the bands below.',
            'Duration of the core sleeve must stay between 4.0 and 7.0 years, measured at each month end.',
            'A position outside the band must be brought back within ten business days. If it cannot be, the portfolio manager reports the breach and a plan to the Investment Committee.',
            '### 4.3 Credit risk',
            'No single issuer other than a sovereign may exceed 3% of the sleeve. Bonds rated below BBB- are sold within 90 days of a downgrade, unless the committee approves a longer hold.'
        ]
    },
    'committee-minutes': {
        title: 'Investment Committee Minutes - September',
        fileName: 'Committee Minutes 2026-09.pdf',
        pageCount: 6,
        page: 2,
        passage:
            'The committee agreed to hold duration near 6.5 years and review the position in December.',
        paragraphs: [
            '### Item 3 - Portfolio duration',
            'The portfolio manager presented the effect of the September purchases, which lifted the duration of the core sleeve from 5.8 to 6.4 years.',
            'Members discussed the rates outlook. Most expect policy rates to stay on hold into next year, with some risk of a steeper curve.',
            'The committee agreed to hold duration near 6.5 years and review the position in December.',
            '### Item 4 - Any other business',
            'None.'
        ]
    },
    'core-readme': {
        title: 'Core Models - Tools',
        fileName: 'core/README.md',
        pageCount: 24,
        page: 7,
        passage:
            'Tools with an execute function run in the browser, so the model can act on the app. Set needsApproval to ask the user before each call runs.',
        paragraphs: [
            '### Tools',
            'A chat can offer the model tools. Each has a name, a description and a JSON schema for its input.',
            'Tools with an execute function run in the browser, so the model can act on the app. Set needsApproval to ask the user before each call runs.',
            'Tools without one run on the server. List them too, to give their calls a title, an icon and a summary.'
        ]
    }
};

//------------------------------------------------------------------
// Seed threads
//------------------------------------------------------------------
const MINUTE = 60_000,
    HOUR = 60 * MINUTE,
    DAY = 24 * HOUR;

/**
 * The threads the store starts with, and returns to on a reset: finished histories spread over
 * today, yesterday, this week and last month, so that every recency group shows. One ended in a
 * failure, and one carries a saved rating. Times are relative to now.
 */
export function createSeedThreads(): LocalThread[] {
    const now = Date.now();
    return [
        {
            id: 'seed-limits',
            title: 'Gross limit usage by desk',
            createdAt: now - 12 * MINUTE,
            lastActivityAt: now - 4 * MINUTE,
            messages: createSampleConversation()
        },
        {
            id: 'seed-rates',
            title: 'Q3 rates outlook summary',
            createdAt: now - DAY - 2 * HOUR,
            lastActivityAt: now - DAY - HOUR,
            messages: turn('seed-rates', now - DAY - HOUR, {
                question: 'Summarize the Q3 rates outlook in three points.',
                answer: markdown(`
                    1. **Policy rates on hold.** Most forecasters expect no change before the
                       second quarter of next year.
                    2. **A steeper curve.** Term premia rose, so long yields climbed more than
                       short ones.
                    3. **Inflation near target.** Core inflation eased to 2.4%, which leaves room
                       to cut later.
                `),
                feedback: 'positive'
            })
        },
        {
            id: 'seed-spreads',
            title: 'High yield spread widening',
            createdAt: now - 3 * DAY,
            lastActivityAt: now - 3 * DAY,
            lastRunEnd: 'failed',
            lastRunReason: 'The model service did not respond in time.',
            messages: turn('seed-spreads', now - 3 * DAY, {
                question: 'Why did high yield spreads widen this month?',
                answer: 'Spreads widened 35 bp, led by energy and retail issuers. Looking at the',
                error: 'The model service did not respond in time.'
            })
        },
        {
            id: 'seed-fx',
            title: 'Hedging FX on the EUR book',
            createdAt: now - 5 * DAY,
            lastActivityAt: now - 5 * DAY,
            messages: turn('seed-fx', now - 5 * DAY, {
                question: 'How much of the EUR book is hedged back to dollars?',
                answer: markdown(`
                    **82%** of the EUR exposure is hedged, with three-month forwards rolled each
                    quarter. The unhedged 18% sits in the opportunistic sleeve, where the mandate
                    allows currency risk up to 20%.
                `)
            })
        },
        {
            id: 'seed-liquidity',
            title: 'Liquidity buffer under stress',
            createdAt: now - 22 * DAY,
            lastActivityAt: now - 22 * DAY,
            messages: turn('seed-liquidity', now - 22 * DAY, {
                question: 'Would the liquidity buffer cover a 10% redemption?',
                answer: markdown(`
                    Yes. Cash and bonds that settle in two days or less come to **14%** of assets,
                    so a 10% redemption leaves a 4% buffer. The policy minimum is 5% after
                    redemptions, so a second wave in the same month would need a sale of credit.
                `)
            })
        },
        {
            id: 'seed-onboarding',
            title: 'Onboarding a new fund to the risk system',
            createdAt: now - 41 * DAY,
            lastActivityAt: now - 40 * DAY,
            messages: turn('seed-onboarding', now - 40 * DAY, {
                question: 'What do we need to onboard a new fund to the risk system?',
                answer: markdown(`
                    Three things, in this order:

                    - The fund's **mandate limits**, entered as limit rules.
                    - A daily **positions feed**, mapped to the security master.
                    - A **benchmark**, so that active risk can be measured.

                    Most funds go live in two weeks, once the feed has run clean for five days.
                `)
            })
        }
    ];
}

interface TurnSpec {
    question: string;
    answer: string;
    feedback?: 'positive' | 'negative';
    /** Fails the reply with this message, keeping the answer as what came before the failure. */
    error?: string;
}

/** One question and its reply, as stored. */
function turn(threadId: string, at: number, spec: TurnSpec): ChatMessageSpec[] {
    const {question, answer, feedback, error} = spec;
    return [
        {
            id: `${threadId}-u1`,
            role: 'user',
            content: question,
            status: 'complete',
            createdAt: at - 20_000
        },
        {
            id: `${threadId}-a1`,
            role: 'assistant',
            status: error ? 'error' : 'complete',
            error,
            createdAt: at - 19_000,
            metadata: {
                elapsedMs: error ? 60_000 : 4_200,
                ...(feedback ? {feedback: {rating: feedback}} : {})
            },
            parts: [{id: `${threadId}-a1-x`, type: 'text', state: 'done', text: answer}]
        }
    ];
}
