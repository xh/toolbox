package io.xh.toolbox.app

import com.hazelcast.replicatedmap.ReplicatedMap
import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.http.JSONClient
import io.xh.hoist.json.JSONSerializer
import io.xh.hoist.websocket.WebSocketService
import io.xh.toolbox.github.Commit
import io.xh.toolbox.github.CommitHistory
import org.apache.hc.client5.http.classic.methods.HttpPost
import org.apache.hc.core5.http.io.entity.StringEntity


import java.time.Instant

import static io.xh.hoist.util.DateTimeUtils.MINUTES

/**
 * Service to load commits from the default branches (develop) of XH's GitHub repos.
 *
 * Queries commit history via the GitHub GraphQL API (https://docs.github.com/). Will load the
 * entire commit history for a configured list of repos then cache the results centrally here and
 * load differential updates on a timer to keep the cache fresh.
 *
 * This service requires several config keys to operate. It checks the "gitHubAccessToken" string
 * config on startup to determine if it should do any work at all.
 *
 * Another optional int config - "gitHubMaxPagesPerLoad" - is intended for local development
 * environments, where a developer might wish to enable this service to load *some* commits but
 * has no reason to load the entire history. (Set to a value of 1 to work in this mode.)
 */
class GitHubService extends BaseService {

    static clearCachesConfigs = ['gitHubRepos', 'gitHubAccessToken', 'gitHubMaxPagesPerLoad']

    ConfigService configService
    WebSocketService webSocketService

    private ReplicatedMap<String, CommitHistory> commitsByRepo = getReplicatedMap('commitsByRepo')

    void init() {
        if (configService.getString('gitHubAccessToken', 'none') == 'none') {
            logWarn('Required "gitHubAccessToken" config not present or set to "none" - no commits will be loaded from GitHub.')
        } else {
            createTimer(
                masterOnly: true,
                runFn: this.&loadCommitsForAllRepos,
                interval: 'gitHubCommitsRefreshMins',
                intervalUnits: MINUTES
            )
        }
    }

    /** Return the cached history of commits for a single repo, by name. */
    CommitHistory getCommitsForRepo(String repoName) {
        commitsByRepo[repoName]
    }

    /**
     * Reload commit history for all configured repos from GitHub API.
     * @param forceFullLoad - true to drop any already loaded history, false (default) to do an
     *      incremental load of new commits only.
     */
    private Map<String, CommitHistory> loadCommitsForAllRepos(Boolean forceFullLoad = false) {

        def repos = configService.getList('gitHubRepos', []),
            newCommitCount = 0

        withInfo("Refreshing GitHub commits for ${repos.size()} configured repositories") {
            repos.each{
                def newCommits = loadCommitsForRepo(it as String, forceFullLoad)
                newCommitCount += newCommits.size()
            }

            if (newCommitCount) {
                logDebug("Found $newCommitCount new commits - pushing update...")
                pushUpdate()
            }
        }

        return commitsByRepo
    }

    /**
     * Reload commit history for a single repo, by name.
     * @return collection of newly loaded commits, if any.
     */
    private List<Commit> loadCommitsForRepo(String repoName, Boolean forceFullLoad = false) {
        def hadError = false,
            hasNextPage = true,
            cursor = '',
            pageCount = 1,
            commitHistory = this.getCommitsForRepo(repoName),
            newCommits = new ArrayList<Commit>()

        if (!commitHistory || forceFullLoad) {
            commitHistory = new CommitHistory(repoName)
        }

        // See class-level comment regarding this optional config.
        def maxPagesToLoad = configService.getInt('gitHubMaxPagesPerLoad', 99)

        while (hasNextPage && pageCount <= maxPagesToLoad && !hadError) {
            withDebug("Fetching page ${pageCount} for repo ${repoName}") {
                try {
                    def response = loadCommitsForRepoInternal(repoName, commitHistory.lastCommitTimestamp, cursor)
                    if (response?.data?.repository?.name != repoName) {
                        throw new RuntimeException("JSON returned by GitHub API not in expected format")
                    }

                    def history = response.data.repository.defaultBranchRef.target.history,
                        pageInfo = history.pageInfo,
                        rawCommits = history.nodes as List

                    logDebug("Fetched ${newCommits.size() + rawCommits.size()} / ${history.totalCount} commits for this batch")
                    cursor = pageInfo.endCursor
                    hasNextPage = pageInfo.hasNextPage
                    pageCount++

                    rawCommits.each{raw ->
                        newCommits.add(new Commit(
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
                    logError("Failure fetching commits for $repoName", e)
                    hadError = true
                }
            }
        }

        // This filter is important, as our update checks will include the commit that occurred on
        // commitHistory.lastCommitTimestamp.
        newCommits = newCommits.findAll{!commitHistory.hasCommit(it)}

        if (hadError) {
            logError('Error during commit load', 'no commits will be updated')
            return []
        } else if (!newCommits) {
            logDebug('Commit load complete', 'no new commits found')
            return []
        } else {
            logDebug('Commit load complete', "${newCommits.size()} new commits")
            commitHistory.updateWithNewCommits(newCommits)
            commitsByRepo.put(repoName, commitHistory)
            return newCommits
        }
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

    private String getCommitsQueryJson(String repoName, String sinceTimestamp, String cursor) {
        def query = """
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
"""

        return JSONSerializer.serialize([query: query])
    }

    private JSONClient _jsonClient
    private JSONClient getJsonClient() {
        if (!_jsonClient) {
            _jsonClient = new JSONClient()
        }
        return _jsonClient
    }

    private void pushUpdate() {
        webSocketService.pushToChannels(
            webSocketService.allChannels*.key, 'gitHubUpdate',
            [timestamp: Instant.now()]
        )
    }

    void clearCaches() {
        _jsonClient = null
        if (isMaster) {
            commitsByRepo.clear()
            loadCommitsForAllRepos()
        }
        super.clearCaches()
    }


    Map getAdminStats() { [
        config: configForAdminStats('gitHubAccessToken', 'gitHubRepos', 'gitHubMaxPagesPerLoad')
    ]}
}
