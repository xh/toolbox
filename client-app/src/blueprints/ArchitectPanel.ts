import {chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {placeholder} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import type {BlueprintShellModel} from './BlueprintShellModel';

/** The Architect's conversation about the open blueprint. */
export const architectPanel = hoistCmp.factory<BlueprintShellModel>({
    displayName: 'ArchitectPanel',

    render({model}) {
        const {chatModel} = model,
            hasAccess = XH.getUser().hasRole('TOOLBOX_LLM_USER');
        return panel({
            title: 'Architect',
            icon: Icon.ai(),
            compactHeader: true,
            modelConfig: {side: 'left', defaultSize: 400, minSize: 300},
            headerItems: [
                button({
                    icon: Icon.delete(),
                    tooltip: 'Clear conversation',
                    disabled: !hasAccess || chatModel.isEmpty || chatModel.isBusy,
                    onClick: () => model.clearConversationAsync()
                })
            ],
            item: hasAccess
                ? chatPanel({
                      model: chatModel,
                      flex: 1,
                      emptyStateProps: {
                          icon: null,
                          title: 'Ask the Architect',
                          text: 'Describe the view you want, or a change to this one.'
                      },
                      composerProps: {placeholder: 'Show my positions by sector...'},
                      messageListProps: {assistantName: 'Architect'}
                  })
                : placeholder(
                      Icon.lock(),
                      'The Architect needs the TOOLBOX_LLM_USER role. Contact XH to request access.'
                  )
        });
    }
});
