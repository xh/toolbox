import {chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {placeholder, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {BlueprintShellModel} from './BlueprintShellModel';
import {usageText} from './llmUsage';

/** The Architect's conversation about the open blueprint. */
export const architectPanel = hoistCmp.factory<BlueprintShellModel>({
    displayName: 'ArchitectPanel',
    model: uses(BlueprintShellModel),

    render({model}) {
        const {chatModel, usage} = model,
            hasAccess = XH.getUser().hasRole('TOOLBOX_LLM_USER'),
            left = usageText(usage);
        return panel({
            title: 'Architect',
            icon: Icon.ai(),
            compactHeader: true,
            modelConfig: {side: 'left', defaultSize: 400, minSize: 300},
            headerItems: [
                span({
                    omit: !left,
                    className: 'tb-blueprints__usage',
                    title: usage
                        ? `${usage.calls} calls this hour, ${usage.tokens} tokens today`
                        : null,
                    item: left
                }),
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
                      composerProps: {placeholder: model.type.examplePrompt},
                      messageListProps: {assistantName: 'Architect'}
                  })
                : placeholder(
                      Icon.lock(),
                      'The Architect needs the TOOLBOX_LLM_USER role. Contact XH to request access.'
                  )
        });
    }
});
