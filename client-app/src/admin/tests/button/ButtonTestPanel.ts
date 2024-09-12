import {div, li, ul} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import {splitButton} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {elementFromContent} from '@xh/hoist/utils/react';
import {castArray} from 'lodash';
import './ButtonTestPanel.scss';

export const buttonTestPanel = hoistCmp.factory(() => {
    return panel({
        className: 'xh-tiled-bg',
        items: [splitButtonPanel()]
    });
});

const splitButtonPanel = hoistCmp.factory(() => {
    const text = 'Hoist Apps',
        recalls = {
            text: 'FDA Recalls',
            icon: Icon.health(),
            actionFn: () => window.open('/recalls', '_blank')
        },
        news = {
            text: 'News',
            icon: Icon.news(),
            actionFn: () => window.open('/news', '_blank')
        },
        portfolio = {
            text: 'Portfolio',
            icon: Icon.portfolio(),
            actionFn: () => window.open('/portfolio', '_blank')
        },
        menuItems = [portfolio, recalls, news],
        defaultConf = {
            text,
            menuItems,
            onClick: () => window.open('/app/examples', '_blank')
        };

    return panel({
        title: 'SplitButton',
        className: 'tb-split-button-test-panel',
        item: div({
            className: 'tb-split-button-test-panel__inner',
            items: [
                example({
                    content: () => splitButton({...defaultConf})
                }),
                example({
                    features: `menuSide: 'left'`,
                    content: () => splitButton({...defaultConf, menuSide: 'left'})
                }),
                example({
                    features: `minimal: true`,
                    content: () => splitButton({...defaultConf, minimal: true})
                }),
                example({
                    features: ['minimal: true', `intent: 'primary'`],
                    content: () => splitButton({...defaultConf, minimal: true, intent: 'primary'})
                }),
                example({
                    features: ['icon', `intent: 'success'`],
                    content: () =>
                        splitButton({...defaultConf, icon: Icon.books(), intent: 'success'})
                }),
                example({
                    features: 'disabled: true',
                    content: () => splitButton({...defaultConf, disabled: true})
                }),
                example({
                    features: 'menuItems: []',
                    content: () => splitButton({...defaultConf, menuItems: []})
                }),
                example({
                    features: 'menuItems: undefined',
                    content: () => splitButton({...defaultConf, menuItems: undefined})
                }),
                example({
                    features: `menuItem props`,
                    content: () =>
                        splitButton({
                            ...defaultConf,
                            menuItems: [
                                {...portfolio, intent: 'primary'},
                                {...news, disabled: true},
                                {...recalls}
                            ]
                        })
                }),
                example({
                    features: [`custom className`],
                    content: () => splitButton({...defaultConf, className: 'special-split-button'})
                })
            ]
        })
    });
});

const example = hoistCmp.factory(({features, content}) =>
    div({
        className: 'tb-button-example',
        items: [
            elementFromContent(content),
            features ? ul(castArray(features).map(it => li(it))) : null
        ]
    })
);
