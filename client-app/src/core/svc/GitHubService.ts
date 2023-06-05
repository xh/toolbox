import {HoistService, PlainObject, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {computed, observable, makeObservable, runInAction} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {forOwn, sortBy} from 'lodash';

// TODO - auto-refresh with app, do so efficiently, only replacing local data when new commits.
export class GitHubService extends HoistService {
    static instance: GitHubService;

    /** Loaded commits histories, keyed by repoName. */
    @observable.ref commitHistories: PlainObject = {};

    /** Loaded array of commits across all repositories. */
    @computed
    get allCommits() {
        const ret = [];
        forOwn(this.commitHistories, v => ret.push(...v.commits));
        return sortBy(ret, it => -it.committedDate);
    }

    constructor() {
        super();
        makeObservable(this);
    }

    override async initAsync() {
        // Subscribe to websocket based updates so we refresh and pick up new commits immediately.
        XH.webSocketService.subscribe('gitHubUpdate', () => this.loadAsync());

        // Note we do not await this - we don't want the app load to block here.
        this.loadAsync();
    }

    override async doLoadAsync() {
        try {
            const priorCommitCount = this.allCommits.length,
                commitHistories = await XH.fetchJson({
                    url: 'gitHub/allCommits'
                });

            forOwn(commitHistories, v => {
                // Minor translations here on client for convenience.
                v.commits.forEach(it => {
                    it.authorEmail = it.author.email;
                    it.authorName = it.author.name || it.authorEmail;
                    it.committedDate = new Date(it.committedDate);
                    it.committedDay = LocalDate.from(it.committedDate);
                    it.isRelease =
                        it.authorEmail === 'techops@xh.io' && it.messageHeadline.startsWith('v');
                });
            });

            runInAction(() => (this.commitHistories = commitHistories));

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
