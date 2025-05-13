import {library} from '@fortawesome/fontawesome-svg-core';
import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {faCodeMerge} from '@fortawesome/pro-regular-svg-icons';
import {br, div, filler, span} from '@xh/hoist/cmp/layout';
import {hbox, vbox} from '@xh/hoist/cmp/layout/index';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {hoistCmp, XH} from '@xh/hoist/core/index';
import {button} from '@xh/hoist/desktop/cmp/button';
import {capitalizeWords} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon/index';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {truncate} from 'lodash';

library.add(faGithub, faCodeMerge);

export const roadmapViewItem = hoistCmp.factory({
    model: null,

    render({record}) {
        const {category, name, description, releaseVersion, status, gitLinks, lastUpdated} =
            record.data;
        return vbox({
            className: 'tb-roadmap-item',
            items: [
                hbox(
                    div({
                        className: 'tb-roadmap-item__title',
                        items: [
                            getCategoryIcon(category),
                            name.length > 55
                                ? popover({
                                      popoverClassName: 'tb-roadmap__popover',
                                      minimal: true,
                                      item: truncate(name, {length: 55, omission: ' ...'}),
                                      content: name
                                  })
                                : name
                        ]
                    }),
                    filler(),
                    getGitIcon(gitLinks),
                    popover({
                        popoverClassName: 'tb-roadmap__popover',
                        minimal: true,
                        interactionKind: 'hover',
                        position: 'top',
                        item: div({
                            className: 'tb-roadmap-item__statusIcon',
                            item: getStatusIcon(status)
                        }),
                        content: capitalizeWords(status)
                    })
                ),
                span({
                    className: 'tb-roadmap-item__description',
                    items: [
                        truncate(description, {length: 290, separator: ' ', omission: ' '}),
                        description.length > 290
                            ? popover({
                                  popoverClassName:
                                      'tb-roadmap__popover tb-roadmap__popover--description',
                                  minimal: true,
                                  interactionKind: 'hover',
                                  position: 'left-top',
                                  item: span(' ...'),
                                  content: div({
                                      items: breakUpDescription(description)
                                  })
                              })
                            : ''
                    ]
                }),
                hbox({
                    className: 'tb-roadmap-item__footer',
                    items: [
                        releaseVersion,
                        filler(),
                        relativeTimestamp({
                            timestamp: lastUpdated,
                            options: {prefix: 'Last updated'}
                        })
                    ]
                })
            ]
        });
    }
});

function getStatusIcon(status) {
    const prefix = 'fal',
        size = '2x';
    switch (status) {
        case 'DEVELOPMENT':
            return Icon.gear({className: 'xh-orange', prefix, size});
        case 'RELEASED':
            return Icon.checkCircle({className: 'xh-green', prefix, size});
        case 'PLANNED':
            return Icon.clock({className: 'xh-blue-light', prefix, size});
        case 'MERGED':
            return Icon.icon({iconName: 'code-merge', className: 'xh-green', size});
        default:
            return Icon.questionCircle({prefix, size});
    }
}

function getCategoryIcon(category) {
    let iconName = XH.getConf('roadmapCategories')[category];
    iconName = iconName && Icon[iconName] ? iconName : 'experiment';

    return Icon[iconName]({className: 'xh-blue', prefix: 'fal'});
}

function getGitIcon(gitLinks) {
    if (!gitLinks) return null;
    const gitLinksList = gitLinks.split('\n'),
        gitIcon = Icon.icon({iconName: 'github', prefix: 'fab', size: '2x'});

    if (gitLinksList.length === 1) {
        return button({icon: gitIcon, onClick: () => XH.openWindow(gitLinksList[0], 'gitlink')});
    } else {
        return popover({
            minimal: true,
            item: button({icon: gitIcon}),
            content: menu({items: getGitMenuItems(gitLinks)})
        });
    }
}

function getGitMenuItems(gitLinks) {
    if (!gitLinks) return;

    return gitLinks.split('\n').map(link => {
        return menuItem({
            text: link,
            icon: Icon.icon({iconName: 'github', prefix: 'fab'}),
            onClick: () => XH.openWindow(link, 'gitlink')
        });
    });
}

function breakUpDescription(description) {
    return description.split('\n').reduce((ret, newLine) => {
        ret.push(span(newLine), br());
        return ret;
    }, []);
}
