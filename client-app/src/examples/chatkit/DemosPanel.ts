import {chatClearButton, chatEmptyState, chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {div, hframe, placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, uses} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {canUseLlm, LLM_NO_ACCESS_MSG} from '../../core/llmAccess';
import type {ChatKitDemoModel} from './ChatKitDemoModel';
import {DemosModel} from './DemosModel';

/** The demo conversations: a list of demos on the left, and the active demo's chat. */
export const demosPanel = hoistCmp.factory({
    displayName: 'DemosPanel',
    model: creates(DemosModel),

    render() {
        return hframe(demoNav(), demoChat());
    }
});

/** The list of demo conversations, on the left. */
const demoNav = hoistCmp.factory({
    model: uses(DemosModel),
    render: ({model}) =>
        panel({
            model: model.navPanelModel,
            title: 'Demos',
            icon: Icon.list(),
            compactHeader: true,
            className: 'tb-chatkit__nav',
            item: div({
                className: 'tb-chatkit__nav-items',
                items: model.demoModels.map(it => navItem({key: it.id, demoModel: it}))
            })
        })
});

interface NavItemProps extends HoistProps<DemosModel> {
    demoModel: ChatKitDemoModel;
}

const navItem = hoistCmp.factory<NavItemProps>({
    model: uses(DemosModel),
    render({demoModel, model}) {
        const {demo, chatModel} = demoModel,
            isActive = demoModel === model.activeDemoModel;

        return div({
            className: `tb-chatkit__nav-item ${isActive ? 'tb-chatkit__nav-item--active' : ''}`,
            role: 'button',
            tabIndex: 0,
            'aria-current': isActive || undefined,
            onClick: () => (model.activeDemoId = demo.id),
            onKeyDown: e => {
                if (e.key === 'Enter' || e.key === ' ') model.activeDemoId = demo.id;
            },
            items: [
                div({className: 'tb-chatkit__nav-icon', item: demo.icon}),
                div({
                    className: 'tb-chatkit__nav-text',
                    items: [
                        div({className: 'tb-chatkit__nav-title', item: demo.title}),
                        div({className: 'tb-chatkit__nav-description', item: demo.description})
                    ]
                }),
                chatModel.isBusy
                    ? Icon.spinner({
                          spin: true,
                          title: 'Replying...',
                          className: 'tb-chatkit__nav-status'
                      })
                    : null
            ]
        });
    }
});

/** The chat for the active demo, on the right - or a notice, for a live demo the user cannot use. */
const demoChat = hoistCmp.factory({
    model: uses(DemosModel),
    render({model}) {
        const {demo, chatModel} = model.activeDemoModel;

        if (demo.requiresLlm && !canUseLlm()) {
            return panel({
                key: demo.id,
                title: demo.title,
                icon: demo.icon,
                compactHeader: true,
                flex: 1,
                item: placeholder(Icon.lock(), LLM_NO_ACCESS_MSG)
            });
        }

        return chatPanel({
            key: demo.id,
            model: chatModel,
            testId: 'chat-panel',
            title: demo.title,
            icon: demo.icon,
            compactHeader: true,
            flex: 1,
            headerItems: [
                chatClearButton({
                    testId: 'chat-clear-btn',
                    tooltip: 'Clear the conversation, to run the demo again'
                })
            ],
            emptyState: chatEmptyState({
                icon: demo.icon,
                title: demo.heading,
                text: demo.intro,
                suggestions: demo.suggestions
            }),
            composerProps: {placeholder: demo.placeholder},
            messageListProps: {assistantName: 'Chat Kit', assistantIcon: Icon.sparkles()}
        });
    }
});
