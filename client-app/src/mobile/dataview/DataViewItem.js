import {hoistCmp} from '@xh/hoist/core/index';
import {vbox, div} from '@xh/hoist/cmp/layout/index';
import {Icon} from '@xh/hoist/icon/index';
import {fmtNumber} from '@xh/hoist/format';

import './DataViewItem.scss';

export const dataViewItem = hoistCmp.factory({
    model: null,

    render(props) {
        const {name, city, value} = props.record,
            loser = value < 0;

        return vbox(
            div({
                className: 'dataview-item--name',
                item: name
            }),
            div({
                className: 'dataview-item--city',
                item: city
            }),
            div({
                className: 'dataview-item--value',
                item: fmtNumber(value, {
                    asElement: true,
                    withSignGlyph: true,
                    colorSpec: true,
                    precision: 2
                })
            }),
            loser ?
                Icon.skull({size: '3x', className: 'xh-red', prefix: 'fal'}) :
                Icon.rocket({size: '3x', className: 'xh-green', prefix: 'fal'})
        );
    }
});