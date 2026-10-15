import type {ChatSuggestion} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {chatScopeChip} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {chatWorkspace} from '@xh/hoist-chat-kit/desktop/cmp/workspace';
import {creates, hoistCmp, uses} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {GuideAssistantModel} from './GuideAssistantModel';

/**
 * The guideline assistant: the kit's chat workspace over the user's chats with the emulated
 * backend. The model owns all of its state - this component only lays it out.
 */
export const guideAssistantPanel = hoistCmp.factory({
    displayName: 'GuideAssistantPanel',
    model: creates(GuideAssistantModel),

    render({model}) {
        return chatWorkspace({
            model: model.workspaceModel,
            testId: 'guide-workspace',
            notice: 'Answers come only from six invented lending guidelines, and cite each passage they use.',
            chatPanelProps: {
                citationMarkers: true,
                emptyStateProps: {
                    icon: Icon.book(),
                    title: 'Ask the lending guidelines',
                    text:
                        'Each answer cites the passages it draws on - click a number to read it ' +
                        'in its document. Scope a question to some documents with the chip ' +
                        'under the input.'
                },
                suggestions: SUGGESTIONS,
                composerProps: {
                    placeholder: 'Ask about these documents...',
                    leftItems: scopeChip()
                },
                messageListProps: {assistantName: 'Guidelines', assistantIcon: Icon.book()}
            }
        });
    }
});

/** The document scope of the selected chat's next question. */
const scopeChip = hoistCmp.factory({
    displayName: 'GuideScopeChip',
    model: uses(GuideAssistantModel),

    render({model}) {
        return chatScopeChip({
            documents: model.scopeDocuments,
            value: model.scope,
            onChange: ids => model.setScope(ids)
        });
    }
});

const SUGGESTIONS: ChatSuggestion[] = [
    {
        text: 'How long does an appraisal stay valid?',
        description: 'One document, one citation',
        icon: Icon.home()
    },
    {
        text: 'What is the maximum DTI for a jumbo loan?',
        description: 'Draws on several documents - watch the draft reset',
        icon: Icon.calculator()
    },
    {
        text: 'Can gift funds count toward reserves?',
        description: 'Cites the assets guideline',
        icon: Icon.gift()
    },
    {
        text: 'Do you lend on houseboats?',
        description: 'Not in the library - shows the fixed "not found" reply',
        icon: Icon.search()
    }
];
