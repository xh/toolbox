import {type ChatSuggestion, chatEmptyState, chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {sparklesIcon} from '../Icons';
import {DashboardAgentModel} from './DashboardAgentModel';

/** The Dashboard Agent chat, in the app's side panel. */
export const dashboardAgentPanel = hoistCmp.factory({
    displayName: 'DashboardAgentPanel',
    model: uses(DashboardAgentModel),

    render({model}) {
        const {chatModel} = model;

        return chatPanel({
            model: chatModel,
            testId: 'chat-panel',
            title: 'Dashboard Agent',
            icon: sparklesIcon(),
            compactHeader: true,
            flex: 1,
            minHeight: 0,
            headerItems: [
                button({
                    testId: 'chat-clear-btn',
                    icon: Icon.reset(),
                    tooltip: 'Clear conversation',
                    disabled: chatModel.isEmpty,
                    onClick: () => chatModel.clear()
                })
            ],
            emptyState: chatEmptyState({
                icon: sparklesIcon(),
                title: 'What should we build?',
                text: 'Tell the agent what to build and it will create or update your dashboard.',
                suggestions: SUGGESTIONS
            }),
            messageListProps: {assistantName: 'Dashboard Agent', assistantIcon: sparklesIcon()}
        });
    }
});

const SUGGESTIONS: ChatSuggestion[] = [
    {
        text: 'Compare New York and Tokyo',
        prompt: 'Compare weather in New York and Tokyo side by side'
    },
    {
        text: 'Conditions for 16 cities',
        prompt: 'Show current conditions for 16 major cities in a 4x4 grid'
    },
    {
        text: 'Save a Tokyo overview',
        prompt: 'Set up a Tokyo weather dashboard and save it as a view called "Tokyo Overview"'
    },
    {
        text: 'Simplify to the essentials',
        prompt: 'Simplify to just current conditions and the 5-day forecast'
    },
    {text: 'What can you help me do?'},
    {text: 'How do I change the city?', prompt: 'How do I change which city my dashboard shows?'}
];
