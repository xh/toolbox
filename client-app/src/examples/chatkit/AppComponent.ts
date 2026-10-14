import {chatClearButton, chatEmptyState, chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {div, hframe} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import type {ChatKitDemoModel} from './ChatKitDemoModel';
import '../../core/Toolbox.scss';
import './ChatKit.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            className: 'tb-chatkit',
            tbar: appBar({
                icon: Icon.sparkles({size: '2x', prefix: 'fal'}),
                title: 'Chat Kit',
                rightItems: [
                    button({
                        testId: 'theme-btn',
                        icon: XH.darkTheme ? Icon.sun() : Icon.moon(),
                        tooltip: 'Switch between light and dark themes',
                        outlined: true,
                        onClick: () => XH.toggleTheme()
                    }),
                    appBarSeparator()
                ],
                appMenuButtonProps: {hideLogoutItem: false}
            }),
            item: hframe(demoNav(), demoChat())
        });
    }
});

/** The list of demo conversations, on the left. */
const demoNav = hoistCmp.factory({
    model: uses(AppModel),
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

interface NavItemProps extends HoistProps<AppModel> {
    demoModel: ChatKitDemoModel;
}

const navItem = hoistCmp.factory<NavItemProps>({
    model: uses(AppModel),
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

/** The chat for the active demo, on the right. */
const demoChat = hoistCmp.factory({
    model: uses(AppModel),
    render({model}) {
        const {demo, chatModel} = model.activeDemoModel;

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
