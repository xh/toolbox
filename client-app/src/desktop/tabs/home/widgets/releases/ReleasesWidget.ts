import {markdown} from '@xh/hoist/cmp/markdown';
import {div, filler, hbox, placeholder, span} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {creates, hoistCmp, HoistProps, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {Release} from '../../../../../core/svc/GitHubService';
import {repoFilterPicker} from '../RepoFilterPicker';
import './ReleasesWidget.scss';
import {ReleasesWidgetModel} from './ReleasesWidgetModel';

export const releasesWidget = hoistCmp.factory({
    displayName: 'ReleasesWidget',
    model: creates(ReleasesWidgetModel),
    render({model}) {
        const {allReleases, releases} = model;

        if (!allReleases.length) {
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
            scrollable: true,
            // Make the panel's own (scrolling) content box the flex column for our cards,
            // avoiding an extra wrapper layer.
            contentBoxProps: {display: 'flex', className: 'tb-releases__list'},
            items: releases.length
                ? releases.map(it => releaseCard({release: it, key: it.id}))
                : placeholder(Icon.tag(), 'No releases for the selected repos.'),
            bbar: toolbar({
                compact: true,
                items: [repoFilterPicker(), filler()]
            })
        });
    }
});

interface ReleaseCardProps {
    release: Release;
}

const releaseCard = hoistCmp.factory<HoistProps & ReleaseCardProps>(({release}) => {
    const {repo, tagName, publishedAt, description, url} = release;

    // GitHub's auto-generated release bodies all lead with the same "What's Changed" heading -
    // pure noise when every card would repeat it, so strip before rendering.
    const notes = description?.replace(/^#{1,6}\s*What's Changed\s*/i, '').trim();

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
            notes
                ? div({
                      className: 'tb-releases__card-body',
                      item: markdown({content: notes})
                  })
                : null
        ]
    });
});
