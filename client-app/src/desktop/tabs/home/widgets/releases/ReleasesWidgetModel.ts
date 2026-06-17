import {lookup, HoistModel, XH} from '@xh/hoist/core';
import {DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {bindable} from '@xh/hoist/mobx';
import {uniq} from 'lodash';
import {Release} from '../../../../../core/svc/GitHubService';
import {RepoFilterModel} from '../RepoFilterPicker';

export class ReleasesWidgetModel extends HoistModel implements RepoFilterModel {
    @lookup(DashViewModel)
    private dashViewModel: DashViewModel;

    /** Repos to filter to - empty means show all. */
    @bindable.ref accessor selectedRepos: string[] = [];

    get allReleases(): Release[] {
        return XH.gitHubService.allReleases;
    }

    /** Releases to display, filtered by any repo selection. */
    get releases(): Release[] {
        const {allReleases, selectedRepos} = this;
        return selectedRepos.length
            ? allReleases.filter(it => selectedRepos.includes(it.repo))
            : allReleases;
    }

    get repoOptions(): string[] {
        return uniq(this.allReleases.map(it => it.repo)).sort();
    }

    get recentCount(): number {
        const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
        return this.releases.filter(it => it.publishedAt.getTime() > cutoff).length;
    }

    override onLinked() {
        // Float a live release-cadence summary up into the hosting view's title via
        // DashViewModel.titleDetails - leading middot reads as a segment after the title.
        // Tracks the filtered set, so the stat respects any repo selection.
        this.addReaction({
            track: () => this.releases,
            run: () => {
                const {dashViewModel, releases, recentCount} = this;
                if (dashViewModel && releases.length) {
                    dashViewModel.titleDetails = `· ${recentCount} in the last 90 days`;
                }
            },
            fireImmediately: true
        });
    }
}
