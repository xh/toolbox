import {a, div, hbox, hframe, img, p} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
// @ts-ignore
import xhHoist from '../../../../core/img/xh+hoist.png';
import './WelcomeWidget.scss';

export const welcomeWidget = hoistCmp.factory({
    displayName: 'WelcomeWidget',
    render() {
        const link = (txt: string, url: string) => a({href: url, target: '_blank', item: txt});
        return panel({
            className: 'tb-welcome-widget',
            item: hframe(
                div({
                    className: 'tb-welcome-widget__logo',
                    item: img({src: xhHoist, alt: 'XH + Hoist'})
                }),
                div({
                    className: 'tb-welcome-widget__content',
                    items: [
                        div({
                            className: 'tb-welcome-widget__headline',
                            item: 'Build serious web apps, fast.'
                        }),
                        p(
                            'Hoist is ',
                            link('Extremely Heavy', 'https://xh.io'),
                            "'s full-stack toolkit for data-dense enterprise web applications — a curated React + MobX front end with industrial-strength grids, charts, dashboards, and forms, paired with a Grails / Spring Boot server framework. Refined over a decade of continuous development on demanding real-world apps."
                        ),
                        p(
                            'Toolbox is the live reference app: every component and pattern demoed here is the real framework, and the full ',
                            link('source code', 'https://github.com/xh/toolbox'),
                            ' is open for review.'
                        ),
                        hbox({
                            className: 'tb-welcome-widget__ctas',
                            items: [
                                button({
                                    text: 'Read the Docs',
                                    icon: Icon.book(),
                                    intent: 'primary',
                                    minimal: false,
                                    onClick: () => XH.navigate('default.docs')
                                }),
                                button({
                                    text: 'Browse the Source',
                                    icon: Icon.icon({iconName: 'github', prefix: 'fab'}),
                                    minimal: false,
                                    onClick: () =>
                                        XH.openWindow(
                                            'https://github.com/xh/hoist-react',
                                            'gitlink'
                                        )
                                }),
                                button({
                                    text: 'Meet the Team',
                                    icon: Icon.users(),
                                    minimal: false,
                                    onClick: () => XH.openWindow('/contact', 'contact')
                                })
                            ]
                        })
                    ]
                })
            )
        });
    }
});
