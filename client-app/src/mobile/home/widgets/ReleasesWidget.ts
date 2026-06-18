import {div, filler, hbox, span} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {hoistCmp, HoistProps, XH} from '@xh/hoist/core';
import {Release} from '../../../core/svc/GitHubService';
import './GitHubWidget.scss';

/**
 * Mobile Hoist Releases widget - shows the single most recent published release for each Hoist repo,
 * read live from {@link GitHubService}, sorted so the repo with the newest release sits on top. A
 * compact, tappable single-line row per repo (chip, tag, recency) - the phone-right subset of the
 * desktop releases panel, without its repo filter toolbar.
 */
export const releasesWidget = hoistCmp.factory({
    displayName: 'ReleasesWidget',
    render() {
        const latest = latestReleasePerRepo();

        if (!latest.length) {
            return div({
                className: 'tb-github-widget__empty',
                item: 'GitHub release data unavailable.'
            });
        }

        return div({
            className: 'tb-github-widget',
            items: latest.map(it => releaseRow({release: it, key: it.id}))
        });
    }
});

// `allReleases` is sorted most-recent-first, so the first time we see a repo is its newest release,
// and the picks come out already ordered by release date (newest repo on top).
function latestReleasePerRepo(): Release[] {
    const seen = new Set<string>(),
        ret: Release[] = [];
    for (const release of XH.gitHubService.allReleases) {
        if (!seen.has(release.repo)) {
            seen.add(release.repo);
            ret.push(release);
        }
    }
    return ret;
}

const releaseRow = hoistCmp.factory<HoistProps & {release: Release}>(({release}) => {
    const {repo, tagName, publishedAt, url} = release;
    return hbox({
        className: 'tb-github-widget__row tb-github-widget__row--inline',
        onClick: () => XH.openWindow(url, 'gitlink'),
        items: [
            span({className: `tb-github-widget__repo tb-github-widget__repo--${repo}`, item: repo}),
            span({className: 'tb-github-widget__tag', item: tagName}),
            filler(),
            span({
                className: 'tb-github-widget__date',
                item: relativeTimestamp({timestamp: publishedAt, short: false})
            })
        ]
    });
});
