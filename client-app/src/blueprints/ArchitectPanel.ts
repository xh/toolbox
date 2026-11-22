import {chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {placeholder, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import type {ReactNode} from 'react';
import {BlueprintShellModel} from './BlueprintShellModel';
import {usageText} from './llmUsage';

/** The Architect's conversation about the open blueprint. */
export const architectChat = hoistCmp.factory<BlueprintShellModel>({
    displayName: 'ArchitectChat',
    model: uses(BlueprintShellModel),

    render({model}) {
        return hasAccess()
            ? chatPanel({
                  model: model.chatModel,
                  flex: 1,
                  emptyStateProps: {
                      icon: null,
                      title: 'Ask the Architect',
                      text: 'Describe the view you want, or a change to this one.'
                  },
                  composerProps: {placeholder: model.type.examplePrompt},
                  messageListProps: {assistantName: 'Architect'}
              })
            : placeholder(
                  Icon.lock(),
                  'The Architect needs the TOOLBOX_LLM_USER role. Contact XH to request access.'
              );
    }
});

/** The Architect's header items: what the user has left of the API, and clearing the chat. */
export function architectHeaderItems(model: BlueprintShellModel): ReactNode[] {
    const {chatModel, usage} = model,
        left = usageText(usage);
    return [
        span({
            omit: !left,
            className: 'tb-blueprints__usage',
            title: usage ? `${usage.calls} calls this hour, ${usage.tokens} tokens today` : null,
            item: left
        }),
        button({
            icon: Icon.delete(),
            minimal: true,
            tooltip: 'Clear conversation',
            disabled: !hasAccess() || chatModel.isEmpty || chatModel.isBusy,
            onClick: () => model.clearConversationAsync()
        })
    ];
}

function hasAccess(): boolean {
    return XH.getUser().hasRole('TOOLBOX_LLM_USER');
}
