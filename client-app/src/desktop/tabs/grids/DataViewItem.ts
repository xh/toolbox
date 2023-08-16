import {div, vframe} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {fmtNumber} from '@xh/hoist/format';
import './DataViewItem.scss';

export const dataViewItem = hoistCmp.factory({
    model: null,

    render(props) {
        const {name, city, value} = props.record.data,
            loser = value < 0;

        return vframe({
            className: 'tb-dataview-item',
            items: [
                div({
                    className: 'tb-dataview-item__name',
                    item: name
                }),
                div({
                    className: 'tb-dataview-item__city',
                    item: city
                }),
                div({
                    className: 'tb-dataview-item__value',
                    item: fmtNumber(value, {
                        withSignGlyph: true,
                        colorSpec: true,
                        precision: 2
                    })
                }),
                loser
                    ? Icon.skull({size: '3x', className: 'xh-red', prefix: 'fal'})
                    : Icon.rocket({size: '3x', className: 'xh-green', prefix: 'fal'})
            ]
        });
    }
});
