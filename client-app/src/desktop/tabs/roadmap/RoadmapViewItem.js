import {hoistCmp} from '@xh/hoist/core/index';
import {vbox, box, hbox} from '@xh/hoist/cmp/layout/index';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faCodeMerge} from '@fortawesome/pro-regular-svg-icons';
import {Icon, fontAwesomeIcon} from '@xh/hoist/icon/index';
import {filler, span} from '@xh/hoist/cmp/layout';
import {capitalizeWords} from '@xh/hoist/format';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {button} from '@xh/hoist/desktop/cmp/button';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {fab} from '@fortawesome/free-brands-svg-icons';

library.add(fab, faCodeMerge);

export const roadmapViewItem = hoistCmp.factory({
    model: null,
    render(props) {
        const {category, name, description, releaseVersion, status, gitLinks, lastUpdated} = props.record.data;
        let gitLinksMap;
        if (gitLinks !== null) {
            gitLinksMap = gitLinks.split(',');
        }
        let statusIcon, categoryIcon;
        let iconName = XH.configService.get('roadmapCategories')[category];

        switch (status) {
            case 'MERGED':
                statusIcon = fontAwesomeIcon({icon: faCodeMerge, size: '2x', prefix: 'fal'});
                break;
            case 'DEVELOPMENT':
                statusIcon = Icon.gear({size: '2x', className: 'xh-orange', prefix: 'fal'});
                break;
            case 'RELEASED':
                statusIcon = Icon.check({size: '2x', className: 'xh-green', prefix: 'fal'});
                break;
            case 'PLANNED':
                statusIcon = Icon.clipboard({size: '2x', className: 'xh-blue-light', prefix: 'fal'});
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
        const truncateDescription = (text) => {
            if (text.length > 194) {
                return text.substring(0, 194) + '...';
            } else {
                return text;
            }
        };

        return vbox(
            box({
                className: 'dataview-item--name',
                items: [
                    categoryIcon,
                    name
                ]
            }),
            popover({
                popoverClassName: 'popover--description',
                minimal: true,
                interactionKind: 'hover',
                target: hbox({
                    className: 'dataview-item--description',
                    item: span(truncateDescription(description))
                }),
                position: 'left-top',
                content: description
            }),
            hbox({
                className: 'dataview-item--footer',
                items: [
                    releaseVersion,
                    filler(),
                    relativeTimestamp({timestamp: lastUpdated, options: {prefix: 'Last updated '}})
                ]
            }),
            popover({
                className: 'dataview-item--git',
                minimal: true,
                target: button({
                    icon: fontAwesomeIcon({icon: ['fab', 'github'], size: '2x', prefix: 'fal'})
                }),
                content: menu({
                    items: gitLinksMap ? gitLinksMap.map((link) => {
                        return menuItem({
                            text: link,
                            icon: fontAwesomeIcon({icon: ['fab', 'github']}),
                            onClick: () => window.open(link)
                        });
                    }) : menuItem({
                        text: 'No Github issue created yet ...'
                    })
                })
            }),
            popover({
                popoverClassName: 'popover--status',
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