import {div, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {hoistCmp, HoistProps, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {Release} from '../../../core/svc/GitHubService';
import './GitHubWidget.scss';

// Cap the in-card list so a single widget stays a reasonable height; the full history lives on GitHub.
const MAX_ROWS = 10;

/**
 * Mobile Hoist Releases widget - a compact, tappable list of the most recent published releases
 * across the Hoist repos, read live from {@link GitHubService}. The phone-right subset of the
 * desktop releases panel: repo, tag, and recency, without the desktop's repo filter toolbar.
 */
export const releasesWidget = hoistCmp.factory({
    displayName: 'ReleasesWidget',
    render() {
        const releases = XH.gitHubService.allReleases;

        if (!releases.length) {
            return div({
                className: 'tb-github-widget__empty',
                item: 'GitHub release data unavailable.'
            });
        }

        return div({
            className: 'tb-github-widget',
            items: releases.slice(0, MAX_ROWS).map(it => releaseRow({release: it, key: it.id}))
        });
    }
});

const releaseRow = hoistCmp.factory<HoistProps & {release: Release}>(({release}) => {
    const {repo, tagName, publishedAt, url} = release;
    return hbox({
        className: 'tb-github-widget__row',
        onClick: () => XH.openWindow(url, 'gitlink'),
        items: [
            span({className: `tb-github-widget__repo tb-github-widget__repo--${repo}`, item: repo}),
            vbox({
                className: 'tb-github-widget__row-text',
                items: [
                    div({className: 'tb-github-widget__row-title', item: tagName}),
                    div({
                        className: 'tb-github-widget__row-sub',
                        item: relativeTimestamp({timestamp: publishedAt})
                    })
                ]
            }),
            Icon.chevronRight({className: 'tb-github-widget__row-chevron'})
        ]
    });
});
