import {div, hbox, img, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {FaviconModel} from '../../FaviconModel';

const SIZES = [16, 32, 48, 64, 180];

/** The design at common display sizes, 1:1 in CSS px. */
export const sizeStrip = hoistCmp.factory({
    displayName: 'SizeStrip',
    model: uses(FaviconModel),

    render({model}) {
        const {svgDataUrl} = model;
        return panel({
            title: 'Every size',
            icon: Icon.search(),
            compactHeader: true,
            className: 'tb-fav-sizes',
            contentBoxProps: {justifyContent: 'center'},
            item: hbox({
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: 16,
                overflow: 'visible',
                items: SIZES.map(size =>
                    // Overflow stays visible so the frame's outline is not clipped.
                    vbox({
                        key: size,
                        alignItems: 'center',
                        gap: 4,
                        overflow: 'visible',
                        items: [
                            div({
                                className: 'tb-fav-sizes__frame tb-fav-checkerboard',
                                item: img({
                                    src: svgDataUrl,
                                    alt: `${size}px preview`,
                                    width: size,
                                    height: size
                                })
                            }),
                            div({className: 'tb-fav-sizes__label', item: `${size}`})
                        ]
                    })
                )
            })
        });
    }
});
