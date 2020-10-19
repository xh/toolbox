import {HoistService} from '@xh/hoist/core';

@HoistService
export class GitHubService {

    async getCommitsAsync(repoNames) {
        // const loads = repoNames.map(repoName => {
        //     return XH.fetchJson({
        //         url: `gitHub/commits${repoName}`
        //     });
        // });
        //
        // const ret = [],
        //     results = await Promise.allSettled(loads);
        //
        // TODO - extract commits from new simpler serialization
        // results.forEach((it, idx) => {
        //     it.value.data.repository.defaultBranchRef.target.history.nodes.forEach(it => {
        //         const committedDate = moment(it.committedDate).toDate();
        //         ret.push({
        //             id: `${repoName}-${it.abbreviatedOid}`,
        //             repo: repoName,
        //             abbreviatedOid: it.abbreviatedOid,
        //             authorName: it.author?.user?.name || it.author?.email,
        //             authorEmail: it.author?.email ?? 'UNKNOWN',
        //             committedDate,
        //             committedDay: LocalDate.from(committedDate),
        //             messageHeadline: it.messageHeadline,
        //             changedFiles: it.changedFiles,
        //             additions: it.additions,
        //             deletions: it.deletions,
        //             url: it.url,
        //             isRelease: it.author?.email == 'techops@xh.io' && it.messageHeadline.startsWith('v')
        //         });
        //     });
        // });
        //
        // return ret;
    }

}
