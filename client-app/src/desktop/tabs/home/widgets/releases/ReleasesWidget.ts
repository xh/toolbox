import {markdown} from '@xh/hoist/cmp/markdown';
import {div, filler, hbox, placeholder, span, vbox} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {creates, hoistCmp, HoistProps, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {Release} from '../../../../../core/svc/GitHubService';
import './ReleasesWidget.scss';
import {ReleasesWidgetModel} from './ReleasesWidgetModel';

export const releasesWidget = hoistCmp.factory({
    displayName: 'ReleasesWidget',
    model: creates(ReleasesWidgetModel),
    render({model}) {
        const {releases, recentCount} = model;

        if (!releases.length) {
            return panel({
                className: 'tb-releases',
                item: placeholder(
                    Icon.icon({iconName: 'github', prefix: 'fab'}),
                    'GitHub release data unavailable.',
                    'Check the gitHubAccessToken config if running locally.'
                )
            });
        }

        return panel({
            className: 'tb-releases',
            tbar: toolbar({
                compact: true,
                items: [Icon.tag(), span(`${recentCount} releases in the last 90 days`), filler()]
            }),
            item: vbox({
                className: 'tb-releases__list',
                items: releases.map(it => releaseCard({release: it, key: it.id}))
            })
        });
    }
});

interface ReleaseCardProps {
    release: Release;
}

const releaseCard = hoistCmp.factory<HoistProps & ReleaseCardProps>(({release}) => {
    const {repo, tagName, publishedAt, description, url} = release;
    return div({
        className: 'tb-releases__card',
        onClick: () => XH.openWindow(url, 'gitlink'),
        items: [
            hbox({
                className: 'tb-releases__card-header',
                items: [
                    span({className: `tb-releases__repo tb-releases__repo--${repo}`, item: repo}),
                    span({className: 'tb-releases__tag', item: tagName}),
                    filler(),
                    relativeTimestamp({timestamp: publishedAt})
                ]
            }),
            description
                ? div({
                      className: 'tb-releases__card-body',
                      item: markdown({content: description})
                  })
                : null
        ]
    });
});
