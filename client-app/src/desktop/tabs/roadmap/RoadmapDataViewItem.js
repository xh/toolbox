import {hoistCmp} from '@xh/hoist/core/index';
import {vbox, box} from '@xh/hoist/cmp/layout/index';
import {Icon} from '@xh/hoist/icon/index';

export const RoadmapDataViewItem = hoistCmp.factory({
    model: null,

    render(props) {
        const {name, description, status} = props.record.data;

        return vbox(
            box({
                className: 'dataview-item--name',
                item: name
            }),
            box({
                className: 'dataview-item--description',
                item: description
            }),
            box({
                className: 'dataview-item--status',
                item: status
            }),
            Icon.check({size: '3x', className: 'xh-green', prefix: 'fal'})
        );
    }
});
