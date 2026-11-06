import {div, svg} from '@xh/hoist/cmp/layout';
import {elementFactory} from '@xh/hoist/core';
import type {ReactElement} from 'react';
import './RadioCardPreviews.scss';

const path = elementFactory('path'),
    rect = elementFactory('rect'),
    circle = elementFactory('circle');

export type ChartShape = 'line' | 'area' | 'bar' | 'pie';

/** A small chart-shape thumbnail, drawn in SVG, for a chart-type radio card. */
export function chartThumb(shape: ChartShape): ReactElement {
    return svg({
        className: `tb-rc-chart tb-rc-chart--${shape}`,
        viewBox: '0 0 64 40',
        width: 64,
        height: 40,
        items: chartMarks(shape)
    });
}

function chartMarks(shape: ChartShape): ReactElement[] {
    const axis = path({key: 'axis', className: 'tb-rc-chart__axis', d: 'M4 36 H60'});
    switch (shape) {
        case 'line':
            return [axis, path({key: 'm', className: 'tb-rc-chart__line', d: LINE_D})];
        case 'area':
            return [
                axis,
                path({key: 'f', className: 'tb-rc-chart__fill', d: `${LINE_D} V36 H4 Z`}),
                path({key: 'm', className: 'tb-rc-chart__line', d: LINE_D})
            ];
        case 'bar':
            return [
                axis,
                ...[14, 22, 10, 26, 18].map((h, i) =>
                    rect({
                        key: i,
                        className: 'tb-rc-chart__bar',
                        x: 8 + i * 10,
                        y: 36 - h,
                        width: 7,
                        height: h,
                        rx: 1
                    })
                )
            ];
        case 'pie':
            return [
                circle({key: 'c', className: 'tb-rc-chart__fill', cx: 32, cy: 20, r: 16}),
                path({
                    key: 's',
                    className: 'tb-rc-chart__slice',
                    d: 'M32 20 V4 A16 16 0 0 1 47 25 Z'
                })
            ];
    }
}

const LINE_D = 'M4 30 L16 22 L26 26 L38 12 L48 16 L60 6';

export type PanelLayout = 'single' | 'split' | 'sidebar' | 'grid';

/** A wireframe of a panel arrangement, for a layout-picker radio card. */
export function layoutThumb(layout: PanelLayout): ReactElement {
    const paneCount = {single: 1, split: 2, sidebar: 2, grid: 4}[layout];
    return div({
        className: `tb-rc-layout tb-rc-layout--${layout}`,
        items: Array.from({length: paneCount}, (_, i) =>
            div({key: i, className: 'tb-rc-layout__pane'})
        )
    });
}
