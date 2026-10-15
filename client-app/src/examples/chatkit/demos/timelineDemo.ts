import type {ChatToolSpec} from '@xh/hoist-chat-kit/core';
import {
    ScriptedChatTransport,
    type ScriptedItem,
    scriptedDelay,
    subagentEvents,
    textEvents,
    toolCallEvents
} from '@xh/hoist-chat-kit/transport';
import {Icon} from '@xh/hoist/icon';
import type {ChatKitDemo} from './Types';

/**
 * An agentic run in the activity timeline: a plan, a query, narration, a batch of three calls, a
 * sub-agent whose call fails and is retried, and the answer. Every call is a backend call with its
 * result in the script, so the browser runs no tools.
 */
export const timelineDemo: ChatKitDemo = {
    id: 'timeline',
    title: 'Agent timeline',
    description: 'A plan, a batch of calls and a sub-agent',
    icon: Icon.list(),
    heading: 'Follow an agent at work',
    intro:
        'The agent plans, queries, fans out, and hands part of the work to a sub-agent whose ' +
        'first call fails. The timeline summarizes the run as it goes, then folds to one line.',
    suggestions: [{text: 'Which desks are over their gross limit today?'}],
    createChatConfig: () => ({
        transport: new ScriptedChatTransport({delayMs: 20, respond: () => createRun()}),
        tools: TOOLS
    })
};

//------------------
// Implementation
//------------------
function createRun(): ScriptedItem[] {
    const pause = (ms: number) => [scriptedDelay(ms)];
    return [
        toolCallEvents(
            'update_plan',
            {
                items: [
                    {title: 'Load desk limits', status: 'active'},
                    {title: 'Pull gross exposure per desk', status: 'pending'},
                    {title: 'Compare to limits and flag breaches', status: 'pending'}
                ]
            },
            {toolCallId: 'plan1', result: 'ok'}
        ),
        toolCallEvents(
            'run_sql',
            {sql: 'SELECT desk, gross_limit FROM limits WHERE as_of = :today'},
            {toolCallId: 'sql1', result: [{desk: 'Technology', gross_limit: 250_000_000}]}
        ),
        pause(400),
        textEvents('Six desks have limits today. Pulling gross exposure for each in parallel.', {
            messageId: 'n1'
        }),
        ['Technology', 'Regional Banks', 'Energy'].map((desk, idx) =>
            toolCallEvents('query_exposure', {desk}, {toolCallId: `q${idx + 1}`, result: {desk}})
        ),
        pause(400),
        subagentEvents(
            'Limits Checker',
            [
                toolCallEvents(
                    'read_policy',
                    {file: 'Risk Policy 2026.pdf'},
                    {toolCallId: 'p1', result: 'Gross limits apply per desk.'}
                ),
                toolCallEvents(
                    'fetch_marks',
                    {url: 'GET marks-service/v2/marks'},
                    {toolCallId: 'm1', error: '504 Timeout'}
                ),
                pause(400),
                toolCallEvents(
                    'fetch_marks',
                    {url: 'GET marks-service/v2/marks'},
                    {toolCallId: 'm2', result: {marks: 6}}
                )
            ],
            {
                subagentRunId: 'agent1',
                description: 'Compare exposure to limits and explain breaches',
                result: '2 desks over limit. Technology at 112%, Regional Banks at 104%.'
            }
        ),
        toolCallEvents(
            'update_plan',
            {
                items: [
                    {title: 'Load desk limits', status: 'done'},
                    {title: 'Pull gross exposure per desk', status: 'done'},
                    {title: 'Compare to limits and flag breaches', status: 'done'}
                ]
            },
            {toolCallId: 'plan2', result: 'ok'}
        ),
        textEvents(
            'Two desks are over their gross limit: **Technology (112%)** and **Regional Banks (104%)**.',
            {messageId: 'answer'}
        )
    ];
}

/** Backend tools shown in the timeline, and the plan. */
const TOOLS: ChatToolSpec[] = [
    {name: 'update_plan', display: 'pinned'},
    {name: 'run_sql', displayName: 'Load desk limits', display: 'timeline'},
    {name: 'query_exposure', displayName: 'Query exposure', display: 'timeline'},
    {name: 'read_policy', displayName: 'Read policy', display: 'timeline'},
    {name: 'fetch_marks', displayName: 'Fetch intraday marks', display: 'timeline'}
];
