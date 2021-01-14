import {LoadSupport, HoistService, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
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
        // Subscribe to websocket based updates so we refresh and pick up new commits immediately.
        XH.webSocketService.subscribe('gitHubUpdate', () => this.loadAsync());

        // Note we do not await this - we don't want the app load to block here.
        this.loadAsync();
    }

    async doLoadAsync(loadSpec) {
        try {
            const priorCommitCount = this.allCommits.length,
                commitHistories = await XH.fetchJson({
                    url: 'gitHub/allCommits',
                    loadSpec
                });

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

            const newCommitCount = this.allCommits.length;
            if (priorCommitCount && newCommitCount > priorCommitCount) {
                XH.toast({
                    message: 'New Hoist commit detected!',
                    icon: Icon.icon({iconName: 'github', prefix: 'fab'}),
                    intent: 'primary'
                });
            }
        } catch (e) {
            XH.handleException(e, {showAlert: false, showAsError: false});
        }
    }

}
