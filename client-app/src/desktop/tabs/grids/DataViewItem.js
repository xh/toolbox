import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core/index';
import {vbox, box} from '@xh/hoist/cmp/layout/index';
import {Icon} from '@xh/hoist/icon/index';
import {fmtNumber} from '@xh/hoist/format';

@HoistComponent
class DataViewItem extends Component {

    render() {
        const {name, city, value} = this.props.record,
            loser = value < 0;
        return vbox(
            box({
                className: 'dataview-item--name',
                item: name
            }),
            box({
                className: 'dataview-item--city',
                item: city
            }),
            box({
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
}

export const dataViewItem = elemFactory(DataViewItem);
