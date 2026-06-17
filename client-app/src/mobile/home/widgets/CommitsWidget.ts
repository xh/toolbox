import {div, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {hoistCmp, HoistProps, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {Commit} from '../../../core/svc/GitHubService';
import './GitHubWidget.scss';

// Cap the in-card list so a single widget stays a reasonable height; the full history lives on GitHub.
const MAX_ROWS = 12;

/**
 * Mobile Recent Commits widget - a compact, tappable list of the latest commits across the Hoist
 * repos, read live from {@link GitHubService}. The phone-right subset of the desktop activity grid:
 * repo, subject, author, and recency, rendered as a simple list rather than a full data grid.
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
    return hbox({
        className: 'tb-github-widget__row',
        onClick: () => XH.openWindow(url, 'gitlink'),
        items: [
            span({className: `tb-github-widget__repo tb-github-widget__repo--${repo}`, item: repo}),
            vbox({
                className: 'tb-github-widget__row-text',
                items: [
                    div({className: 'tb-github-widget__row-title', item: messageHeadline}),
                    div({
                        className: 'tb-github-widget__row-sub',
                        items: [
                            span(authorName),
                            span({className: 'tb-github-widget__row-dot', item: '·'}),
                            relativeTimestamp({timestamp: committedDate})
                        ]
                    })
                ]
            }),
            Icon.chevronRight({className: 'tb-github-widget__row-chevron'})
        ]
    });
});
