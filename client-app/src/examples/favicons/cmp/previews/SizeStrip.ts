import {card} from '@xh/hoist/cmp/card';
import {div, hbox, img, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import type {ReactElement} from 'react';
import {FaviconModel} from '../../FaviconModel';

const SIZES = [16, 32, 48, 64, 180];
const PEEK_SIZES = [16, 32] as const;
const PEEK_ZOOM = 4;

/**
 * The design at common display sizes, 1:1 in CSS px, plus a "pixel peek" - real 16px and 32px
 * PNG renders blown up 4x with no smoothing, to show exactly which pixels survive.
 */
export const sizeStrip = hoistCmp.factory({
    displayName: 'SizeStrip',
    model: uses(FaviconModel),

    render({model}) {
        const {svgDataUrl, peekUrls} = model;
        return card({
            title: 'Every size',
            icon: Icon.search(),
            className: 'tb-fav-sizes',
            contentBoxProps: {
                flexFlow: 'row wrap',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '16px 24px'
            },
            items: [
                sizeRow(
                    SIZES.map(size =>
                        sizeTile({
                            key: size,
                            label: `${size}`,
                            src: svgDataUrl,
                            size,
                            displaySize: size
                        })
                    )
                ),
                div({
                    className: 'tb-fav-sizes__peek',
                    items: [
                        div({className: 'tb-fav-sizes__peek-title', item: 'Pixel peek'}),
                        sizeRow(
                            PEEK_SIZES.map(size =>
                                sizeTile({
                                    key: size,
                                    label: `${size}px x${PEEK_ZOOM}`,
                                    src: peekUrls?.[size],
                                    size,
                                    displaySize: size * PEEK_ZOOM,
                                    pixelated: true
                                })
                            )
                        )
                    ]
                })
            ]
        });
    }
});

function sizeRow(items: ReactElement[]) {
    return hbox({alignItems: 'flex-end', gap: 16, overflow: 'visible', items});
}

function sizeTile({
    key,
    label,
    src,
    size,
    displaySize,
    pixelated = false
}: {
    key: number;
    label: string;
    src: string;
    size: number;
    displaySize: number;
    pixelated?: boolean;
}) {
    // Overflow stays visible so the frame's outline is not clipped.
    return vbox({
        key,
        alignItems: 'center',
        gap: 4,
        overflow: 'visible',
        items: [
            div({
                className: 'tb-fav-sizes__frame tb-fav-checkerboard',
                style: {width: displaySize, height: displaySize},
                item: src
                    ? img({
                          className: pixelated ? 'tb-fav-sizes__img--pixelated' : null,
                          src,
                          alt: `${size}px preview`,
                          width: displaySize,
                          height: displaySize
                      })
                    : null
            }),
            div({className: 'tb-fav-sizes__label', item: label})
        ]
    });
}
