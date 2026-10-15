import {scriptedDelay, textEvents, toolCallEvents} from '@xh/hoist-chat-kit/transport';
import type {
    ChatRunRequest,
    ScriptedItem,
    ScriptedRequestContext
} from '@xh/hoist-chat-kit/transport';
import type {PlainObject} from '@xh/hoist/core';
import {compact, last, sortBy} from 'lodash';
import {markdown} from '../demos/scriptUtils';

/** A grid change that the scripted helper recognizes in the user's message. */
export interface GridHelperAction {
    /** The `gridTools` tool that makes the change. */
    toolName: string;

    /** The tool call's input. */
    input: PlainObject;

    /** A sentence for the reply, once the change is made. */
    reply: string;
}

/**
 * The changes asked for in a message, in the order the message asks for them. Each phrase the
 * script knows maps to one `gridTools` call, so "group by sector and sort by market value" makes
 * two changes in one reply, under one Undo.
 */
export function matchGridActions(text: string): GridHelperAction[] {
    const matches = compact(
        PHRASES.map(({pattern, action}) => {
            const match = pattern.exec(text ?? '');
            return match ? {index: match.index, action} : null;
        })
    );
    return sortBy(matches, 'index').map(it => it.action);
}

/**
 * The scripted model behind the Grid Helper tab, for a `ScriptedChatTransport`. The first step
 * calls the `gridTools` tools for the changes the message asks for, which the browser runs on the
 * grid. The second step reads their results and answers. A message that asks for no change gets
 * a help answer, which cites one of the helper's documentation pages.
 */
export function createGridHelperResponse(
    request: ChatRunRequest,
    {stepIndex, requestIndex, userMessage}: ScriptedRequestContext
): ScriptedItem[] {
    const text = userMessage?.text ?? '',
        actions = matchGridActions(text);

    if (actions.length === 0) return [scriptedDelay(400), textEvents(getHelpAnswer(text))];

    if (stepIndex === 0) {
        return [
            scriptedDelay(400),
            actions.map((it, idx) =>
                toolCallEvents(it.toolName, it.input, {toolCallId: `grid-${requestIndex}-${idx}`})
            )
        ];
    }

    // The last message is the reply the turn is building, with the calls from the first step.
    const calls = last(request.messages).toolCalls,
        sentences = actions.map((action, idx) => {
            const call = calls[idx];
            return call?.state === 'output-available'
                ? action.reply
                : `I couldn't make one change: ${call?.errorText ?? 'it did not run'}`;
        });
    return [scriptedDelay(300), textEvents(sentences.join(' '))];
}

/** Prompts for the helper's empty state, each on a scripted path. */
export const GRID_HELPER_SUGGESTIONS = [
    'Group by sector and sort by market value',
    'Hide the price column',
    'Show only technology'
];

//------------------
// Implementation
//------------------
const PHRASES: Array<{pattern: RegExp; action: GridHelperAction}> = [
    {
        pattern: /\bgroup (it |rows |them )?by sector\b/i,
        action: {
            toolName: 'group_grid',
            input: {columns: ['sector']},
            reply: 'Each sector is now a group you can collapse.'
        }
    },
    {
        pattern: /\b(ungroup|remove (the )?grouping)\b/i,
        action: {
            toolName: 'group_grid',
            input: {columns: []},
            reply: 'The grid is back to one list.'
        }
    },
    {
        pattern: /\bsort (it |rows |them )?by (market value|mkt value)\b/i,
        action: {
            toolName: 'sort_grid',
            input: {sorts: [{column: 'marketValue', direction: 'desc'}]},
            reply: 'The largest positions are at the top.'
        }
    },
    {
        pattern: /\bhide (the )?price( column)?\b/i,
        action: {
            toolName: 'update_columns',
            input: {changes: [{column: 'price', visible: false}]},
            reply: 'Price is hidden. Ask me to show it again, or use the column chooser.'
        }
    },
    {
        pattern: /\bshow (the )?price( column)?\b/i,
        action: {
            toolName: 'update_columns',
            input: {changes: [{column: 'price', visible: true}]},
            reply: 'Price is back.'
        }
    },
    {
        pattern: /\b(show )?only tech(nology)?\b/i,
        action: {
            toolName: 'filter_grid',
            input: {filters: [{field: 'sector', op: '=', value: 'Technology'}]},
            reply:
                'Only Technology positions show now. The Sector header shows the filter, and ' +
                'you can clear it there.'
        }
    },
    {
        pattern: /\b(clear (the )?filters?|show (all|everything))\b/i,
        action: {
            toolName: 'clear_filters',
            input: {},
            reply: 'Every position shows again.'
        }
    }
];

/** Help answers by topic. The first that matches the message answers it. */
const HELP_TOPICS: Array<{pattern: RegExp; text: string}> = [
    {
        pattern: /filter/i,
        text: markdown(`
            The Sector, Mkt Value and P&L Day headers have a filter menu, where you pick values
            or set a condition. A header shows an icon while its filter is on. I can filter for
            you too: try "show only technology".

            [Column filtering](/app/grids/columnFiltering)
        `)
    },
    {
        pattern: /group/i,
        text: markdown(`
            Grouping puts rows with the same value under one header row, which you can collapse.
            This demo's script knows "group by sector" and "ungroup".

            [Grouped rows](/app/grids/groupedRows)
        `)
    },
    {
        pattern: /column|hide|show|width|pin/i,
        text: markdown(`
            Drag a column header to move it, and drag its edge to resize it. The column chooser
            shows and hides columns. This demo's script knows "hide the price column" and "show
            the price column".

            [Column chooser](/app/grids/columnChooser)
        `)
    }
];

const GENERAL_HELP = markdown(`
    I can change this grid's layout - group, sort and filter its rows, and show or hide its
    columns. My replies in this demo are scripted, so I know only a few phrases:

    - "Group by sector", or "ungroup"
    - "Sort by market value"
    - "Hide the price column", or "show the price column"
    - "Show only technology", or "clear filters"

    I see the grid's columns, sorting, grouping and filters, but not its rows.
`);

function getHelpAnswer(text: string): string {
    return HELP_TOPICS.find(it => it.pattern.test(text))?.text ?? GENERAL_HELP;
}
