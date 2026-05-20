import {div, hframe, a, img, p} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
// @ts-ignore
import xhHoist from '../../../../core/img/xh+hoist.png';
import './WelcomeWidget.scss';

export const welcomeWidget = hoistCmp.factory(() => {
    const link = (txt, url) => a({href: url, target: '_blank', item: txt});
    return panel({
        className: 'tb-welcome-widget',
        items: [
            hframe(
                div({
                    className: 'tb-welcome-widget__logo',
                    item: img({src: xhHoist, alt: 'xh.io + Hoist'})
                }),
                div({
                    className: 'tb-welcome-widget__greeting',
                    items: [
                        p({
                            style: {fontWeight: 500},
                            item: ['Welcome, ', XH.getUser().displayName, '!']
                        }),
                        p(
                            'Toolbox demonstrates key components, code patterns, utilities, and other tooling included in ',
                            link('Hoist React', 'https://github.com/xh/hoist-react/'),
                            ' and ',
                            link('Hoist Core', 'https://github.com/xh/hoist-core/'),
                            ', libraries created by ',
                            link('Extremely Heavy', 'https://xh.io'),
                            ' for building and operating enterprise web applications.'
                        ),
                        p(
                            'Hoist provides a curated selection of custom and third-party components, pre-integrated to function as a highly productive full-stack framework for web application development.'
                        ),
                        p(
                            'The Toolbox app itself is written using Hoist, and its ',
                            link('source code', 'https://github.com/xh/toolbox'),
                            ' is available for review.'
                        ),
                        p(
                            'Meet our ',
                            link('talented and dedicated team', '/contact'),
                            " in our example 'Contact' app. We are always looking for great developers who want to join us!"
                        ),
                        p(
                            link('Contact us', 'https://xh.io/'),
                            ' with questions or for more information - we would love to hear from you!'
                        ),
                        p({
                            className: 'tb-welcome-widget__signoff',
                            item: '- The XH Team'
                        })
                    ]
                })
            )
        ]
    });
});
