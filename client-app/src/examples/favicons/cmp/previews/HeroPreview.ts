import {div, hbox, img, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {startCase} from 'lodash';
import {FaviconModel} from '../../FaviconModel';
import {PREFIX_LABELS} from '../../lib/FaviconSpec';
import {checkBanners, tileCls} from './CheckBanners';

/**
 * The full-size 512px output, on a checkerboard to show any transparency. Flags low glyph/backdrop
 * contrast with a banner, shrinking the stage to make room so the previews grid does not move.
 */
export const heroPreview = hoistCmp.factory({
    displayName: 'HeroPreview',
    model: uses(FaviconModel),

    render({model}) {
        const {spec, svgDataUrl} = model;
        return panel({
            title: 'favicon.svg',
            icon: Icon.magic(),
            compactHeader: true,
            className: tileCls(model, 'hero', 'tb-fav-hero'),
            banner: checkBanners(model, 'hero'),
            contentBoxProps: {alignItems: 'center', justifyContent: 'center'},
            items: [
                div({
                    className: 'tb-fav-hero__stage tb-fav-checkerboard',
                    item: img({
                        className: 'tb-fav-hero__img',
                        src: svgDataUrl,
                        alt: `Favicon preview - ${spec.iconName}`
                    })
                }),
                hbox({
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 6,
                    items: [
                        span({className: 'tb-fav-chip', item: '512 x 512'}),
                        span({
                            className: 'tb-fav-chip',
                            item: `${startCase(spec.iconName)} - ${PREFIX_LABELS[spec.prefix]}`
                        })
                    ]
                })
            ]
        });
    }
});
