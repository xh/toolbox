import {div, hbox, span} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {hoistCmp, HoistProps, XH} from '@xh/hoist/core';
import {Commit} from '../../../core/svc/GitHubService';
import './GitHubWidget.scss';

// Cap the in-card list so a single widget stays a reasonable height; the full history lives on GitHub.
const MAX_ROWS = 12;

/**
 * Mobile Recent Commits widget - a compact, tappable list of the latest commits across the Hoist
 * repos, read live from {@link GitHubService}. The phone-right subset of the desktop activity grid:
 * repo + subject on the first line, author and recency on a full-width second line, rendered as a
 * simple list rather than a full data grid.
 */
export const commitsWidget = hoistCmp.factory({
    displayName: 'CommitsWidget',
    render() {
        const commits = XH.gitHubService.allCommits;

        if (!commits.length) {
            return div({
                className: 'tb-github-widget__empty',
                item: 'GitHub commit data unavailable.'
            });
        }

        return div({
            className: 'tb-github-widget',
            items: commits.slice(0, MAX_ROWS).map(it => commitRow({commit: it, key: it.id}))
        });
    }
});

const commitRow = hoistCmp.factory<HoistProps & {commit: Commit}>(({commit}) => {
    const {repo, messageHeadline, authorName, committedDate, url} = commit;
    return div({
        className: 'tb-github-widget__row tb-github-widget__row--commit',
        onClick: () => XH.openWindow(url, 'gitlink'),
        items: [
            // Line 1: repo chip + commit subject (subject truncates to a single line).
            hbox({
                className: 'tb-github-widget__commit-head',
                items: [
                    span({
                        className: `tb-github-widget__repo tb-github-widget__repo--${repo}`,
                        item: repo
                    }),
                    span({className: 'tb-github-widget__row-title', item: messageHeadline})
                ]
            }),
            // Line 2: author + recency, spanning the full row width on a single line.
            div({
                className: 'tb-github-widget__row-sub',
                items: [
                    span(authorName),
                    span({className: 'tb-github-widget__row-dot', item: '·'}),
                    relativeTimestamp({timestamp: committedDate, short: false})
                ]
            })
        ]
    });
});
