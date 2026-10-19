import {
    type ChatSuggestion,
    chatClearButton,
    chatEmptyState,
    chatPanel
} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {placeholder} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {canUseLlm, LLM_NO_ACCESS_MSG} from '../../../core/llmAccess';
import {sparklesIcon} from '../Icons';
import {DashboardAgentModel} from './DashboardAgentModel';

/**
 * The Dashboard Agent chat, in the app's side panel. A user without access to the LLM demos sees a
 * notice in its place - the rest of the app works without it.
 */
export const dashboardAgentPanel = hoistCmp.factory({
    displayName: 'DashboardAgentPanel',
    model: uses(DashboardAgentModel),

    render({model}) {
        if (!canUseLlm()) {
            return panel({
                title: 'Dashboard Agent',
                icon: sparklesIcon(),
                compactHeader: true,
                flex: 1,
                item: placeholder(Icon.lock(), LLM_NO_ACCESS_MSG)
            });
        }

        const {chatModel} = model;

        return chatPanel({
            model: chatModel,
            testId: 'chat-panel',
            title: 'Dashboard Agent',
            icon: sparklesIcon(),
            compactHeader: true,
            flex: 1,
            minHeight: 0,
            headerItems: [chatClearButton({testId: 'chat-clear-btn'})],
            emptyState: chatEmptyState({
                icon: sparklesIcon(),
                title: 'Ask about the weather, or what to build',
                text:
                    'Ask a quick weather question for an answer right here, or tell the agent ' +
                    'what to build and it will create or update your dashboard.',
                suggestions: SUGGESTIONS
            }),
            composerProps: {placeholder: 'Ask about the weather, or what to build...'},
            messageListProps: {assistantName: 'Dashboard Agent', assistantIcon: sparklesIcon()}
        });
    }
});

const SUGGESTIONS: ChatSuggestion[] = [
    {text: "What's the weekend forecast in London?"},
    {
        text: 'Compare New York and Tokyo',
        prompt: 'Compare the weather in New York and Tokyo this week'
    },
    {text: 'Is it raining in Paris right now?'},
    {
        text: 'Build a dashboard for my trip to Lisbon',
        prompt: 'Build a dashboard for my trip to Lisbon next week'
    },
    {
        text: 'Simplify to the essentials',
        prompt: 'Simplify to just current conditions and the 5-day forecast'
    },
    {
        text: 'Save a Tokyo overview',
        prompt: 'Set up a Tokyo weather dashboard and save it as a view called "Tokyo Overview"'
    }
];
