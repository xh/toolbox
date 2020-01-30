import {hoistCmp} from '@xh/hoist/core/index';
import {vbox, box} from '@xh/hoist/cmp/layout/index';
import {Icon} from '@xh/hoist/icon/index';

export const RoadmapDataViewItem = hoistCmp.factory({
    model: null,

    render(props) {
        const {category, name, description, releaseVersion, status, gitLink, lastUpdated, lastUpdatedBy} = props.record.data;

        let statusIcon;
        switch (status) {
            case 'MERGED':
                statusIcon = Icon.check({size: '3x', className: 'xh-green', prefix: 'fal'});
                break;
            case 'DEVELOPMENT':
                statusIcon = Icon.gear({size: '3x', className: 'xh-yellow', prefix: 'fal'});
                break;
            case 'RELEASE':
                statusIcon = Icon.bullhorn({size: '3x', className: 'xh-green', prefix: 'fal'});
                break;
            case 'PLANNED':
                statusIcon = Icon.clipboard({size: '3x', className: 'xh-blue', prefix: 'fal'});
        }


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
                className: 'dataview-item--releaseVersion',
                item: releaseVersion
            }),
            statusIcon
        );
    }
});
