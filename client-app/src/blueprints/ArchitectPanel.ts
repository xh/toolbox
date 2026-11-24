import type {ChatMessage, ChatPartRenderContext} from '@xh/hoist-chat-kit/core';
import {chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';

import {placeholder, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {menu, menuDivider, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {useCallback} from 'react';
import type {ReactNode} from 'react';
import type {ArchitectExports} from './architectExport';
import {endsTurn, turnIdOf} from './architectExport';
import {BlueprintShellModel} from './BlueprintShellModel';
import {usageText} from './llmUsage';

const EXPORT_NOTE =
    'Exports hold each tool call with its result, so they can include data rows, cut to the first 5 of each list.';

/** The Architect's conversation about the open blueprint. */
export const architectChat = hoistCmp.factory<BlueprintShellModel>({
    displayName: 'ArchitectChat',
    model: uses(BlueprintShellModel),

    render({model}) {
        const turnActions = useCallback(
            (message: ChatMessage, context: ChatPartRenderContext) =>
                turnMenu(model.architectExports, message, context),
            [model]
        );
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
                  messageListProps: {assistantName: 'Architect', messageActions: turnActions}
              })
            : placeholder(
                  Icon.lock(),
                  'The Architect needs the TOOLBOX_LLM_USER role. Contact XH to request access.'
              );
    }
});

/** The Architect's header items: what the user has left of the API, exports, and clearing the chat. */
export function architectHeaderItems(model: BlueprintShellModel): ReactNode[] {
    const {chatModel, usage} = model,
        left = usageText(usage);
    return [
        span({
            omit: !left,
            className: 'tb-blueprints__usage',
            title: usage ? `${usage.calls} calls this hour, ${usage.tokens} tokens today` : null,
            children: left
        }),
        popover({
            position: 'bottom-right',
            disabled: chatModel.isEmpty,
            content: menu(
                menuItem({
                    text: 'Export conversation',
                    icon: Icon.download(),
                    onClick: () => model.architectExports.downloadConversation('json')
                }),
                menuItem({
                    text: 'Export conversation as Markdown',
                    icon: Icon.fileText(),
                    onClick: () => model.architectExports.downloadConversation('md')
                }),
                menuDivider(),
                menuItem({
                    text: 'Copy last turn as Markdown',
                    icon: Icon.copy(),
                    onClick: () => model.architectExports.copyLastTurnAsync()
                })
            ),
            children: button({
                icon: Icon.download(),
                minimal: true,
                disabled: chatModel.isEmpty,
                tooltip: `Export the conversation. ${EXPORT_NOTE}`
            })
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

// A turn's exports, on its last reply once the turn is done.
function turnMenu(
    exports: ArchitectExports,
    message: ChatMessage,
    context: ChatPartRenderContext
): ReactNode[] {
    const {chatModel} = context,
        messages = chatModel?.messages ?? [];
    if (!exports || chatModel?.isBusy || !endsTurn(messages, message.id)) return [];
    const turnId = turnIdOf(messages, message.id);
    return [
        popover({
            key: 'export',
            position: 'top-right',
            content: menu(
                menuItem({
                    text: 'Export turn',
                    icon: Icon.download(),
                    onClick: () => exports.downloadTurn(turnId)
                }),
                menuItem({
                    text: 'Save as harness scenario',
                    icon: Icon.experiment(),
                    disabled: !exports.hasContext(turnId),
                    title: exports.hasContext(turnId)
                        ? null
                        : 'This turn ran before the page loaded, so its blueprint and context were not kept.',
                    onClick: () => exports.downloadScenario(turnId)
                })
            ),
            children: button({
                icon: Icon.download(),
                tooltip: `Export this turn. ${EXPORT_NOTE}`,
                'aria-label': 'Export this turn'
            })
        })
    ];
}

function hasAccess(): boolean {
    return XH.getUser().hasRole('TOOLBOX_LLM_USER');
}
