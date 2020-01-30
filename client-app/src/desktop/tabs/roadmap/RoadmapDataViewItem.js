import {hoistCmp} from '@xh/hoist/core/index';
import {vbox, box, hbox} from '@xh/hoist/cmp/layout/index';
import {Icon} from '@xh/hoist/icon/index';
import {filler, span} from '@xh/hoist/cmp/layout';
import {fmtCompactDate} from '@xh/hoist/format';

export const roadmapDataViewItem = hoistCmp.factory({
    model: null,

    render(props) {
        const {category, name, description, releaseVersion, status, gitLink, lastUpdated, lastUpdatedBy} = props.record.data;

        let statusIcon, categoryIcon;
        switch (status) {
            case 'MERGED':
                statusIcon = Icon.check({size: '2x', className: 'xh-green-muted', prefix: 'fal'});
                break;
            case 'DEVELOPMENT':
                statusIcon = Icon.gear({size: '2x', className: 'xh-yellow', prefix: 'fal'});
                break;
            case 'RELEASED':
                statusIcon = Icon.bullhorn({size: '2x', className: 'xh-green', prefix: 'fal'});
                break;
            case 'PLANNED':
                statusIcon = Icon.clipboard({size: '2x', className: 'xh-blue', prefix: 'fal'});
                break;
        }
        switch (category) {
            case 'Grids':
                categoryIcon = Icon.grid({size: '1x', className: 'xh-blue', prefix: 'fal'});
                break;
            case 'Dashboards':
                categoryIcon = Icon.analytics({size: '1x', className: 'xh-blue', prefix: 'fal'});
                break;
            case 'Other':
                categoryIcon = Icon.experiment({size: '1x', className: 'xh-blue', prefix: 'fal'});
                break;
        }

        return vbox(
            box({
                className: 'dataview-item--name',
                items: [
                    categoryIcon,
                    name
                ]
            }),
            box({
                className: 'dataview-item--description',
                item: description
            }),
            hbox({
                className: 'dataview-item--footer',
                items: [
                    releaseVersion,
                    filler(),
                    span('Last updated: ' + fmtCompactDate(lastUpdated))
                ]
            }),
            statusIcon
        );
    }
});
