import {div, img, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {FaviconModel} from '../../FaviconModel';
import {previewCard} from './PreviewCard';

/** The 16px favicon in light and dark browser tab strips. */
export const browserTabMock = hoistCmp.factory({
    displayName: 'BrowserTabMock',
    model: uses(FaviconModel),

    render({model}) {
        const {svgDataUrl, spec} = model,
            appName = spec.appName || 'My App';

        return previewCard({
            title: 'Browser tabs',
            icon: Icon.window(),
            className: 'tb-fav-tabs',
            items: ['light', 'dark'].map(theme =>
                div({
                    key: theme,
                    className: `tb-fav-tabs__browser tb-fav-tabs__browser--${theme}`,
                    items: [
                        div({
                            className: 'tb-fav-tabs__strip',
                            items: [
                                div({
                                    className: 'tb-fav-tabs__tab tb-fav-tabs__tab--active',
                                    items: [
                                        img({src: svgDataUrl, width: 16, height: 16, alt: ''}),
                                        span({className: 'tb-fav-tabs__title', item: appName}),
                                        span({className: 'tb-fav-tabs__close', item: '×'})
                                    ]
                                }),
                                div({
                                    className: 'tb-fav-tabs__tab',
                                    items: [
                                        Icon.browser({className: 'tb-fav-tabs__other-icon'}),
                                        span({className: 'tb-fav-tabs__title', item: 'New Tab'}),
                                        span({className: 'tb-fav-tabs__close', item: '×'})
                                    ]
                                })
                            ]
                        }),
                        div({
                            className: 'tb-fav-tabs__toolbar',
                            item: div({
                                className: 'tb-fav-tabs__address',
                                item: 'your-app.example.com'
                            })
                        })
                    ]
                })
            )
        });
    }
});
