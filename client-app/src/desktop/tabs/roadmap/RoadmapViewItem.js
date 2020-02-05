import {hoistCmp} from '@xh/hoist/core/index';
import {vbox, box, hbox} from '@xh/hoist/cmp/layout/index';
import {Icon} from '@xh/hoist/icon/index';
import {filler, span} from '@xh/hoist/cmp/layout';
import {capitalizeWords, fmtCompactDate} from '@xh/hoist/format';
import {button} from '@xh/hoist/desktop/cmp/button';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';

export const roadmapViewItem = hoistCmp.factory({
    model: null,
    render(props) {
        const {category, name, description, releaseVersion, status, gitLinks, lastUpdated, lastUpdatedBy} = props.record.data;
        let gitLinksMap;
        if (gitLinks !== null) {
            gitLinksMap = gitLinks.split(',');
        }
        let statusIcon, categoryIcon;
        let iconName = XH.configService.get('roadmapCategories')[category];

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
            case category:
                categoryIcon = Icon[iconName]({size: '1x', className: 'xh-blue', prefix: 'fal'});
                break;
            default:
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
                minimal: true,
                interactionKind: 'hover',
                target: box({
                    className: 'dataview-item--description',
                    item: span(description)
                }),
                position: 'bottom-left',
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
            popover({
                className: 'dataview-item--statusIcon',
                minimal: true,
                interactionKind: 'hover',
                position: 'top',
                target: span({
                    item: statusIcon
                }),
                content: capitalizeWords(status)
            })
        );
    }
});