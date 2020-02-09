import {library} from '@fortawesome/fontawesome-svg-core';
import {fab} from '@fortawesome/free-brands-svg-icons';
import {faCodeMerge} from '@fortawesome/pro-regular-svg-icons';
import {div, filler} from '@xh/hoist/cmp/layout';
import {hbox, vbox} from '@xh/hoist/cmp/layout/index';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {hoistCmp, XH} from '@xh/hoist/core/index';
import {button} from '@xh/hoist/desktop/cmp/button';
import {capitalizeWords} from '@xh/hoist/format';
import {fontAwesomeIcon, Icon} from '@xh/hoist/icon/index';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {truncate} from 'lodash';

library.add(fab, faCodeMerge);

export const roadmapViewItem = hoistCmp.factory({
    model: null,

    render({record}) {
        const {category, name, description, releaseVersion, status, gitLinks, lastUpdated} = record.data,
            gitIcon = fontAwesomeIcon({icon: ['fab', 'github'], size: '2x', prefix: 'fal'});

        return vbox({
            className: 'tb-roadmap-item',
            items: [
                hbox(
                    div({
                        className: 'tb-roadmap-item__title',
                        items: [getCategoryIcon(category), name]
                    }),
                    filler(),
                    popover({
                        minimal: true,
                        target: button({icon: gitIcon}),
                        content: menu({items: getGitMenuItems(gitLinks)})
                    }),
                    popover({
                        popoverClassName: 'tb-roadmap__popover',
                        minimal: true,
                        interactionKind: 'hover',
                        position: 'top',
                        target: div({
                            className: 'tb-roadmap-item__statusIcon',
                            item: getStatusIcon(status)
                        }),
                        content: capitalizeWords(status)
                    })
                ),
                popover({
                    className: 'tb-roadmap-item__description',
                    popoverClassName: 'tb-roadmap__popover tb-roadmap__popover--description',
                    minimal: true,
                    interactionKind: 'hover',
                    position: 'left-top',
                    target: truncate(description, {length: 300}),
                    content: description
                }),
                hbox({
                    className: 'tb-roadmap-item__footer',
                    items: [
                        releaseVersion,
                        filler(),
                        relativeTimestamp({timestamp: lastUpdated, options: {prefix: 'Last updated'}})
                    ]
                })
            ]
        });
    }
});

const getStatusIcon = (status) => {
    const prefix = 'fal', size = '2x';
    switch (status) {
        case 'DEVELOPMENT': return Icon.gear({className: 'xh-orange', prefix, size});
        case 'RELEASED': return Icon.checkCircle({className: 'xh-green', prefix, size});
        case 'PLANNED': return Icon.clipboard({className: 'xh-blue-light', prefix, size});
        case 'MERGED': return fontAwesomeIcon({icon: faCodeMerge, className: 'xh-green', prefix, size});
        default: return Icon.questionCircle({prefix, size});
    }
};

const getCategoryIcon = (category) => {
    const iconName = XH.getConf('roadmapCategories')[category] ?? 'experiment';
    return Icon[iconName]({className: 'xh-blue', prefix: 'fal'});
};

const getGitMenuItems = (gitLinks) => {
    if (!gitLinks) {
        return [menuItem({text: 'No linked Github issues yet.'})];
    }

    return gitLinks.split(',').map((link) => {
        return menuItem({
            text: link,
            icon: fontAwesomeIcon({icon: ['fab', 'github']}),
            onClick: () => window.open(link)
        });
    });
};