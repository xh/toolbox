import {div, img, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {FaviconModel} from '../../FaviconModel';
import {checkBanners} from './CheckBanners';

/**
 * The 16px favicon in light and dark browser tab strips. Flags tab-contrast warnings with banners
 * and - when framed, where this page's own tab icon is not ours to set - offers a full tab.
 */
export const browserTabMock = hoistCmp.factory({
    displayName: 'BrowserTabMock',
    model: uses(FaviconModel),

    render({model}) {
        const {svgDataUrl, spec} = model,
            appName = spec.appName || 'My App';

        return panel({
            title: 'Browser tabs',
            icon: Icon.window(),
            compactHeader: true,
            className: 'tb-fav-tabs',
            banner: [
                ...checkBanners(model, 'tabs'),
                model.isFramed
                    ? {
                          message: 'See it live in a full tab',
                          compact: true,
                          wrap: false,
                          position: 'bottom',
                          actionButtonProps: {
                              text: 'Open',
                              icon: Icon.openExternal(),
                              onClick: () => XH.openWindow(model.shareUrl)
                          }
                      }
                    : null
            ],
            contentBoxProps: {justifyContent: 'center'},
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
