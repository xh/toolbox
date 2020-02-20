import {library} from '@fortawesome/fontawesome-svg-core';
import {fab} from '@fortawesome/free-brands-svg-icons';
import {faCodeMerge} from '@fortawesome/pro-regular-svg-icons';
import {div, filler, span} from '@xh/hoist/cmp/layout';
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
            gitIcon = fontAwesomeIcon({icon: ['fab', 'github'], size: '2x', prefix: 'fal', className: 'fa-fw'});

        return vbox({
            className: 'tb-roadmap-item',
            items: [
                hbox(
                    div({
                        className: 'tb-roadmap-item__title',
                        items: [
                            getCategoryIcon(category),
                            name.length > 55 ?
                                popover({
                                    popoverClassName: 'tb-roadmap__popover',
                                    minimal: true,
                                    target: truncate(name, {length: 55, omission: ' ...'}),
                                    content: name
                                }) : name
                        ]
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
                span({
                    className: 'tb-roadmap-item__description',
                    items: [truncate(description, {length: 230, omission: ' '}),
                        popover({
                            popoverClassName: 'tb-roadmap__popover tb-roadmap__popover--description',
                            minimal: true,
                            interactionKind: 'hover',
                            position: 'left-top',
                            target: span(' [...]'),
                            content: description
                        })
                    ]
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

function getStatusIcon(status) {
    const prefix = 'fal', size = '2x';
    switch (status) {
        case 'DEVELOPMENT': return Icon.gear({className: 'xh-orange', prefix, size});
        case 'RELEASED': return Icon.checkCircle({className: 'xh-green', prefix, size});
        case 'PLANNED': return Icon.clock({className: 'xh-blue-light', prefix, size});
        case 'MERGED': return fontAwesomeIcon({icon: faCodeMerge, className: 'xh-green fa-fw', prefix, size});
        default: return Icon.questionCircle({prefix, size});
    }
}

function getCategoryIcon(category) {
    let iconName = XH.getConf('roadmapCategories')[category];
    iconName = iconName && Icon[iconName] ? iconName : 'experiment';

    return Icon[iconName]({className: 'xh-blue', prefix: 'fal'});
}

function getGitMenuItems(gitLinks) {
    if (!gitLinks) {
        return [menuItem({text: 'No linked Github issues yet.'})];
    }

    return gitLinks.split('\n').map(link => {
        return menuItem({
            text: link,
            icon: fontAwesomeIcon({icon: ['fab', 'github']}),
            onClick: () => window.open(link)
        });
    });
}