import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {vbox, box} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';

@HoistComponent()
class DataViewItem extends Component {

    render() {
        const request = this.props.record,
            {name, value, status} = request,
            isError = status === 'error';

        return vbox(
            box({cls: 'dataview-item-name', item: name}),
            box({cls: 'dataview-item-value', item: `Current Value: $${value.toString()}`}),
            Icon[isError ? 'thumbsDown' : 'thumbsUp']({size: '3x', cls: isError ? 'xh-red' : 'xh-green'})
        );
    }
}

export const dataViewItem = elemFactory(DataViewItem);
