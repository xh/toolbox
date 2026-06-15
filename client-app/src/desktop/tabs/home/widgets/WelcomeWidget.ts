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
                            item: 'Build serious web apps.'
                        }),
                        p(
                            'Hoist is ',
                            link("Extremely Heavy's", 'https://xh.io'),
                            ' full-stack toolkit for building data-dense enterprise SPWAs: a curated yet comprehensive React + MobX front end - grids, charts, dashboards, forms, and the observable data layer beneath them - on a Grails / Spring Boot server platform. Refined over a decade of continuous development on demanding real-world apps.'
                        ),
                        p(
                            'Toolbox is a live reference app: every component and pattern demoed here is real Hoist-powered code, not a mockup - and the ',
                            link('full source', 'https://github.com/xh/toolbox'),
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
                                    icon: Icon.code(),
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
