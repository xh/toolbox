import type {ChatMessageSpec, ChatSourcePart} from '@xh/hoist-chat-kit/core';
import {markdown} from './ChatDemoUtils';

/**
 * A finished conversation, as message specs, for the component pages that render replies
 * without running a turn: the message list over a transcript, sources, feedback and markdown.
 * Two turns: a question answered with reasoning and a tool call, then one answered with a
 * table, code and citations. Times are relative to now, so the headers read naturally.
 */
export function createSampleConversation(): ChatMessageSpec[] {
    const now = Date.now(),
        at = (minutesAgo: number) => now - minutesAgo * 60_000;

    return [
        {
            id: 'u1',
            role: 'user',
            content: 'Which desks are closest to their gross limit today?',
            status: 'complete',
            createdAt: at(12)
        },
        {
            id: 'a1',
            role: 'assistant',
            status: 'complete',
            createdAt: at(12) + 400,
            metadata: {elapsedMs: 6_200},
            parts: [
                {
                    id: 'a1-r',
                    type: 'reasoning',
                    state: 'done',
                    startedAt: at(12) + 400,
                    endedAt: at(12) + 2_100,
                    text: markdown(`
                        The user wants desks ranked by how close they are to their gross limit. I
                        need each desk's gross exposure and its limit, then the ratio. One query
                        returns both.
                    `)
                },
                {
                    id: 'a1-t',
                    type: 'toolCall',
                    toolName: 'query_exposure',
                    state: 'output-available',
                    inputText: '{"asOf":"today"}',
                    input: {asOf: 'today'},
                    output: {
                        rows: [
                            {desk: 'Technology', gross: 281_000_000, limit: 250_000_000},
                            {desk: 'Regional Banks', gross: 104_000_000, limit: 100_000_000},
                            {desk: 'Energy', gross: 88_000_000, limit: 120_000_000}
                        ]
                    },
                    errorText: null,
                    startedAt: at(12) + 2_200,
                    endedAt: at(12) + 3_900
                },
                {
                    id: 'a1-x',
                    type: 'text',
                    state: 'done',
                    text: markdown(`
                        Two desks are **over** their gross limit, and one has room:

                        | Desk | Gross | Limit | Usage |
                        |------|------:|------:|------:|
                        | Technology | $281m | $250m | **112%** |
                        | Regional Banks | $104m | $100m | **104%** |
                        | Energy | $88m | $120m | 73% |

                        Technology is the one to act on first - it has been over since Tuesday's
                        semiconductor rally.
                    `)
                }
            ]
        },
        {
            id: 'u2',
            role: 'user',
            content: 'How do I add a limit check to my Hoist app?',
            status: 'complete',
            createdAt: at(4)
        },
        {
            id: 'a2',
            role: 'assistant',
            status: 'complete',
            createdAt: at(4) + 300,
            metadata: {elapsedMs: 9_800, feedback: null},
            parts: [
                {
                    id: 'a2-x',
                    type: 'text',
                    state: 'done',
                    text: markdown(`
                        Give the model a **client tool** that reads the limits from your app, and
                        let it call the tool when a question needs them [1]. The tool runs in the
                        browser, so it can read a \`GridModel\` directly:

                        \`\`\`typescript
                        const checkLimits: ChatToolSpec = {
                            name: 'check_limits',
                            description: 'Gross exposure against limit, for every desk.',
                            displayName: 'Check limits',
                            icon: Icon.shieldHalved(),
                            execute: () => XH.riskService.getLimitUsageAsync()
                        };
                        \`\`\`

                        The reply then streams through the same transport as any other, and the
                        call shows as a quiet row that opens to its input and output [2]. A tool
                        that changes something should ask first - set \`needsApproval\` [1].

                        > Keep tool results small. A result set belongs in a generative UI
                        > artifact, not in the model's context.
                    `)
                },
                {
                    id: 'a2-s1',
                    type: 'source',
                    sourceType: 'document',
                    marker: 1,
                    title: 'Core Models - Tools',
                    snippet:
                        'Tools with an execute function run in the browser, so the model can act on the app. Set needsApproval to ask the user before each call runs.',
                    metadata: {fileName: 'core/README.md', page: 7, documentId: 'core-readme'}
                },
                {
                    id: 'a2-s2',
                    type: 'source',
                    sourceType: 'url',
                    marker: 2,
                    title: 'Desktop Chat Components - Tool cards',
                    url: 'https://github.com/xh/hoist-chat-kit/blob/develop/desktop/cmp/chat/README.md',
                    snippet:
                        'A tool call shows as a 28px row with its title, summary and status. It opens to the input and output, or to the renderer output.'
                }
            ]
        }
    ];
}

/** The sources of the sample conversation's last reply, for a sources list on its own. */
export function createSampleSources(): ChatSourcePart[] {
    const reply = createSampleConversation().at(-1);
    return reply.parts.filter((it): it is ChatSourcePart => it.type === 'source');
}
