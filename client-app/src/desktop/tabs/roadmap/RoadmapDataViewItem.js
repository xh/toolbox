import {hoistCmp} from '@xh/hoist/core/index';
import {vbox, box, hbox} from '@xh/hoist/cmp/layout/index';
import {Icon} from '@xh/hoist/icon/index';
import {filler, span} from '@xh/hoist/cmp/layout';
import {fmtCompactDate} from '@xh/hoist/format';
import {button} from '@xh/hoist/desktop/cmp/button';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';

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
                    span('Last updated ' + fmtCompactDate(lastUpdated) + ' by: ' + lastUpdatedBy)
                ]
            }),
            popover({
                className: 'dataview-item--git',
                minimal: true,
                interactionKind: 'hover',
                target: button({
                    icon: Icon.openExternal({size: '2x', className: 'xh-black', prefix: 'fal'})
                }),
                content: menu(
                    // map over array of gitLink to display text and get url for onClick.
                    // should create new table for gitLink for one to many relationship for project
                    menuItem({
                        text: 'Github Link',
                        icon: Icon.openExternal(),
                        onClick: () => window.open(gitLink)
                    }),
                    menuItem({
                        text: 'Github Link',
                        icon: Icon.openExternal(),
                        onClick: () => window.open(gitLink)
                    })
                )
            }),
            statusIcon
        );
    }
});

