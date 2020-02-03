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
        const {category, name, description, releaseVersion, status, gitLinks, lastUpdated, lastUpdatedBy} = props.record.data;
        let gitLinksMap;
        if (gitLinks !== null) {
            gitLinksMap = gitLinks.split(',');
        }
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
            case 'GRIDS':
                categoryIcon = Icon.grid({size: '1x', className: 'xh-blue', prefix: 'fal'});
                break;
            case 'DASHBOARDS':
                categoryIcon = Icon.analytics({size: '1x', className: 'xh-blue', prefix: 'fal'});
                break;
            case 'UPGRADES':
                categoryIcon = Icon.bolt({size: '1x', className: 'xh-blue', prefix: 'fal'});
                break;
            case 'NEW FEATURE':
                categoryIcon = Icon.favorite({size: '1x', className: 'xh-blue', prefix: 'fal'});
                break;
            case 'OTHER':
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
            popover({
                className: 'dataview-item--description',
                minimal: true,
                target:  box({
                    item: description
                }),
                position: 'bottom',
                content: description
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
                content: menu({
                    items: gitLinksMap ? gitLinksMap.map((link) => {
                        return menuItem({
                            text: link,
                            icon: Icon.openExternal(),
                            onClick: () => window.open(link)
                        });
                    }) : menuItem({
                        text: 'No Github issue created yet ...'
                    })
                })
            }),
            span({
                className: 'dataview-item--statusIcon',
                item: statusIcon
            })

        );
    }
});

