import {LoadSupport, HoistService, XH} from '@xh/hoist/core';
import {computed, bindable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {forOwn, sortBy} from 'lodash';

// TODO - auto-refresh with app, do so efficiently, only replacing local data when new commits.
@HoistService
@LoadSupport
export class GitHubService {

    /** @member {Object} - loaded commits histories, keyed by repoName. */
    @bindable.ref commitHistories = {};

    /** @return {Object[]} - array of loaded commits across all repositories. */
    @computed
    get allCommits() {
        const ret = [];
        forOwn(this.commitHistories, v => ret.push(...v.commits));
        return sortBy(ret, it => -it.committedDate);
    }

    async initAsync() {
        try {
            // TODO - do we want to await?
            this.loadAsync();
        } catch (e) {
            console.error(`Error initializing GitHubService`, e);
        }
    }

    async doLoadAsync(loadSpec) {
        const commitHistories = await XH.fetchJson({
            url: 'gitHub/allCommits',
            loadSpec
        }).track({
            category: 'GitHub Service',
            message: 'Loaded all commits'
        });

        console.log(commitHistories);
        forOwn(commitHistories, v => {
            // Minor translations here on client for convenience.
            v.commits.forEach(it => {
                it.authorEmail = it.author.email;
                it.authorName = it.author.name || it.authorEmail;
                it.committedDate = new Date(it.committedDate);
                it.committedDay = LocalDate.from(it.committedDate);
                it.isRelease = it.authorEmail == 'techops@xh.io' && it.messageHeadline.startsWith('v');
            });
        });

        this.setCommitHistories(commitHistories);
    }

}
