import {library} from '@fortawesome/fontawesome-svg-core';
import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {HoistService, InitContext, LoadSpec, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {computed, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {forOwn, sortBy} from 'lodash';

// Register the GitHub brand icon for use across commit/release widgets and toasts.
library.add(faGithub);

export interface RepoCommitHistory {
    repo: string;
    lastCommitTimestamp: string;
    firstLoaded: number;
    lastUpdated: number;
    commits: Commit[];
}

export interface Commit {
    id: string;
    repo: string;
    abbreviatedOid: string;
    author: {email: string; name: string};
    authorEmail: string;
    authorName: string;
    committedDate: Date;
    committedDay: LocalDate;
    isRelease: boolean;
    messageHeadline: string;
    messageBody: string;
    changeFiles: number;
    additions: number;
    deletions: number;
    url: string;
}

export interface Release {
    id: string;
    repo: string;
    tagName: string;
    name: string;
    description: string;
    publishedAt: Date;
    url: string;
}

export class GitHubService extends HoistService {
    override telemetryPrefix = 'toolbox.client.github';

    static instance: GitHubService;

    /** Loaded commits histories, keyed by repoName. */
    @observable.ref commitHistories: Record<string, RepoCommitHistory> = {};

    /** Loaded published releases, keyed by repoName. */
    @observable.ref releasesByRepo: Record<string, Release[]> = {};

    /** Loaded array of commits across all repositories. */
    @computed
    get allCommits(): Commit[] {
        const ret = [];
        forOwn(this.commitHistories, v => ret.push(...v.commits));
        return sortBy(ret, it => -it.committedDate);
    }

    /** Loaded array of releases across all repositories, most recent first. */
    @computed
    get allReleases(): Release[] {
        const ret = [];
        forOwn(this.releasesByRepo, v => ret.push(...v));
        return sortBy(ret, it => -it.publishedAt);
    }

    constructor() {
        super();
        makeObservable(this);
    }

    override async initAsync(ctx: InitContext) {
        // Subscribe to websocket based updates so we refresh and pick up new commits immediately.
        XH.webSocketService.subscribe('gitHubUpdate', () => this.autoRefreshAsync());

        // Note we do not await this - we don't want the app load to block here.
        this.loadAsync();
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        await this.runner({loadSpec})
            .span('loadGitHubData')
            .track('Loaded GitHub commit and release history')
            .run(async ctx => {
                const priorCommitCount = this.allCommits.length,
                    [commitHistories, releasesByRepo] = await Promise.all([
                        XH.fetchJson({url: 'gitHub/allCommits'}, ctx).catch(() => ({})),
                        XH.fetchJson({url: 'gitHub/allReleases'}, ctx).catch(() => ({}))
                    ]);

                forOwn(commitHistories, v => {
                    // Minor translations here on client for convenience.
                    v.commits.forEach(it => {
                        it.authorEmail = it.author.email;
                        it.authorName = it.author.name || it.authorEmail;
                        it.committedDate = new Date(it.committedDate);
                        it.committedDay = LocalDate.from(it.committedDate);
                        it.isRelease =
                            it.authorEmail === 'techops@xh.io' &&
                            it.messageHeadline.startsWith('v');
                    });
                });

                forOwn(releasesByRepo, v => {
                    v.forEach(it => (it.publishedAt = new Date(it.publishedAt)));
                });

                runInAction(() => {
                    this.commitHistories = commitHistories;
                    this.releasesByRepo = releasesByRepo;
                });

                const newCommitCount = this.allCommits.length;
                if (priorCommitCount && newCommitCount > priorCommitCount) {
                    XH.toast({
                        message: 'New Hoist commit detected!',
                        icon: Icon.icon({iconName: 'github', prefix: 'fab'}),
                        intent: 'primary'
                    });
                }
            })
            .catch(e => XH.handleException(e, {showAlert: false, showAsError: false}));
    }
}
