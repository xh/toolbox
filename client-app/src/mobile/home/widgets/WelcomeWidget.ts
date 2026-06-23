import {div, hbox, p} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';
import './WelcomeWidget.scss';

/**
 * Mobile Welcome widget - the former landing page, now the top card of the home dashboard. Keeps the
 * pitch and the two key calls-to-action, trimmed to the phone-right subset of the desktop panel.
 */
export const welcomeWidget = hoistCmp.factory({
    displayName: 'WelcomeWidget',
    render() {
        return div({
            className: 'tb-welcome-widget',
            items: [
                div({className: 'tb-welcome-widget__headline', item: 'Build serious web apps.'}),
                p(
                    "Hoist is Extremely Heavy's full-stack toolkit for data-dense enterprise apps. ",
                    'Toolbox is the live reference - every demo here is real Hoist code.'
                ),
                hbox({
                    className: 'tb-welcome-widget__ctas',
                    items: [
                        button({
                            className: 'tb-welcome-widget__read-docs',
                            text: 'Read the Docs',
                            icon: Icon.book(),
                            intent: 'primary',
                            minimal: false,
                            onClick: () =>
                                XH.openWindow('https://github.com/xh/hoist-react#readme', 'gitlink')
                        }),
                        button({
                            icon: Icon.code(),
                            minimal: false,
                            onClick: () => XH.openWindow('https://github.com/xh/toolbox', 'gitlink')
                        })
                    ]
                })
            ]
        });
    }
});
