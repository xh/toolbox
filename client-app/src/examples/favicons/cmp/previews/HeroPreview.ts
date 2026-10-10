import {div, img, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {startCase} from 'lodash';
import {FaviconModel} from '../../FaviconModel';
import {PREFIX_LABELS} from '../../lib/FaviconSpec';
import {previewCard} from './PreviewCard';

/** The full-size 512px output, on a checkerboard to show any transparency. */
export const heroPreview = hoistCmp.factory({
    displayName: 'HeroPreview',
    model: uses(FaviconModel),

    render({model}) {
        const {spec, svgDataUrl} = model;
        return previewCard({
            title: 'favicon.svg',
            icon: Icon.magic(),
            className: 'tb-fav-hero',
            items: [
                div({
                    className: 'tb-fav-hero__stage tb-fav-checkerboard',
                    item: img({
                        className: 'tb-fav-hero__img',
                        src: svgDataUrl,
                        alt: `Favicon preview - ${spec.iconName}`
                    })
                }),
                div({
                    className: 'tb-fav-hero__caption',
                    items: [
                        span({className: 'tb-fav-chip', item: '512 x 512'}),
                        span({
                            className: 'tb-fav-chip tb-fav-chip--glyph',
                            item: `${startCase(spec.iconName)} - ${PREFIX_LABELS[spec.prefix]}`
                        })
                    ]
                })
            ]
        });
    }
});
