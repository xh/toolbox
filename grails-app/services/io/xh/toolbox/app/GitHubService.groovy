package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.http.JSONClient
import io.xh.hoist.json.JSONSerializer
import io.xh.toolbox.github.Commit
import io.xh.toolbox.github.CommitHistory
import org.apache.http.client.methods.HttpPost
import org.apache.http.entity.StringEntity

import static io.xh.hoist.util.DateTimeUtils.MINUTES

class GitHubService extends BaseService {

    ConfigService configService
    Map<String, CommitHistory> commitsByRepo = new HashMap()

    void init() {
        createTimer(
            runFn: this.&loadCommitsForAllRepos,
            interval: 'gitHubCommitsRefreshMins',
            intervalUnits: MINUTES
        )
    }

    /** Return the cached history of commits for a single repo, by name. */
    CommitHistory getCommitsForRepo(String repoName) {commitsByRepo[repoName]}

    /**
     * Reload commit history for all configured repos from GitHub API.
     * @param forceFullLoad - true to drop any already loaded history, false (default) to do an
     *      incremental load of new commits only.
     */
    Map<String, CommitHistory> loadCommitsForAllRepos(Boolean forceFullLoad = false) {
        def repos = configService.getList('gitHubRepos')
        withInfo("Refreshing GitHub commits for ${repos.size()} configured repositories") {
            repos.each{loadCommitsForRepo(it as String, forceFullLoad)}
        }

        return commitsByRepo
    }

    /** Reload commit history for a single repo, by name. */
    CommitHistory loadCommitsForRepo(String repoName, Boolean forceFullLoad = false) {
        def hadError = false,
            hasNextPage = true,
            cursor = '',
            pageCount = 1,
            commitHistory = this.getCommitsForRepo(repoName),
            newCommits = new ArrayList<Commit>()

        if (!commitHistory || forceFullLoad) {
            commitHistory = new CommitHistory(repoName)
        }

        while (hasNextPage && !hadError) {
            withShortInfo("Fetching page ${pageCount} for repo ${repoName}") {
                try {
                    def response = loadCommitsForRepoInternal(repoName, commitHistory.lastCommitTimestamp, cursor)
                    if (response?.data?.repository?.name != repoName) {
                        throw new RuntimeException("JSON returned by GitHub API not in expected format")
                    }

                    def history = response.data.repository.defaultBranchRef.target.history,
                        pageInfo = history.pageInfo,
                        rawCommits = history.nodes as List

                    log.debug("Fetched ${newCommits.size() + rawCommits.size()} / ${history.totalCount} commits for this batch")
                    cursor = pageInfo.endCursor
                    hasNextPage = pageInfo.hasNextPage
                    pageCount++

                    rawCommits.each{raw ->
                        newCommits.push(new Commit(
                            repo: repoName,
                            abbreviatedOid: raw.abbreviatedOid,
                            author: [
                                email: raw.author.email,
                                name: raw.author.user?.name ?: raw.author.email
                            ],
                            committedDate: raw.committedDate,
                            messageHeadline: raw.messageHeadline,
                            messageBody: raw.messageBody,
                            changedFiles: raw.changedFiles,
                            additions: raw.additions,
                            deletions: raw.deletions,
                            url: raw.url
                        ))
                    }

                } catch (e) {
                    log.error("Failure fetching commits for $repoName", e)
                    hadError = true
                }
            }

        }

        // Check size > 1 as update checks on an existing CommitHistory will return 1 spurious
        // "new" commit - the latest commit that itself occurred at lastCommitTimestamp.
        if (hadError) {
            log.error("Error during commit load | no commits will be updated")
        } else if (newCommits.size() > 1) {
            log.info("Commit load complete | got ${newCommits.size()} new commits")
            commitHistory.updateWithNewCommits(newCommits)
            this.commitsByRepo.put(repoName, commitHistory)
        } else {
            log.info("Commit load complete | no new commits found")
        }

        return commitHistory
    }


    //------------------------
    // Implementation
    //------------------------
    private Map loadCommitsForRepoInternal(String repoName, String sinceTimestamp = null, String cursor = null) {
        def query = getCommitsQueryJson(repoName, sinceTimestamp, cursor),
            post = new HttpPost('https://api.github.com/graphql')

        post.setHeader('Accept', 'application/json')
        post.setHeader('Content-type', 'application/json')
        post.setHeader('Authorization', "bearer ${configService.getString('gitHubAccessToken')}")
        post.setEntity(new StringEntity(query))

        jsonClient.executeAsMap(post)
    }

    private String getCommitsQueryJson(String repoName, String sinceTimestamp, cursor) {
        return JSONSerializer.serialize([query: getCommitsQueryString(repoName, sinceTimestamp, cursor)])
    }

    private String getCommitsQueryString(String repoName, String sinceTimestamp, String cursor) {
        return """
query XHRepoCommits {
    repository(owner: "xh", name: "$repoName") {
        name
        defaultBranchRef {
            target {
                ... on Commit {
                    id
                    history(after: ${cursor ? '"' + cursor + '"' : 'null'}, since: ${sinceTimestamp ? '"' + sinceTimestamp + '"' : 'null'}) {
                        totalCount
                        pageInfo {
                            endCursor
                            hasNextPage
                        }
                        nodes {
                            abbreviatedOid
                            committedDate
                            author {
                                email
                                user {
                                    name
                                    login
                                }
                            }
                            messageHeadline
                            messageBody
                            url
                            changedFiles
                            additions
                            deletions
                        }
                    }
                }
            }
        }
    }
}
""".toString()
    }

    private JSONClient _jsonClient
    private JSONClient getJsonClient() {
        if (!_jsonClient) {
            _jsonClient = new JSONClient()
        }
        return _jsonClient
    }

    void clearCaches() {
        this.commitsByRepo = new HashMap()
        this._jsonClient = null
    }

}
