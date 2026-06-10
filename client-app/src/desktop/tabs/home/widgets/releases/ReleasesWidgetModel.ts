import {HoistModel, XH} from '@xh/hoist/core';
import {Release} from '../../../../../core/svc/GitHubService';

export class ReleasesWidgetModel extends HoistModel {
    get releases(): Release[] {
        return XH.gitHubService.allReleases;
    }

    get recentCount(): number {
        const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
        return this.releases.filter(it => it.publishedAt.getTime() > cutoff).length;
    }
}
