package io.xh.toolbox.app


import io.xh.hoist.BaseService
import io.xh.hoist.cache.Cache
import io.xh.hoist.config.ConfigService
import io.xh.hoist.http.JSONClient
import io.xh.hoist.json.JSONSerializer
import io.xh.hoist.websocket.WebSocketService
import io.xh.hoist.util.Timer
import io.xh.toolbox.github.Commit
import io.xh.toolbox.github.CommitHistory
import org.apache.hc.client5.http.classic.methods.HttpPost
import org.apache.hc.core5.http.io.entity.StringEntity

import java.time.Instant

import static io.xh.hoist.util.DateTimeUtils.MINUTES

/**
 * Service to load commits from the default branches (develop) of XH GitHub repos.
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

    /**
     * Non-expiring, replicated cache of commit history by repo name.
     * Populated via primaryOnly timer to keep the cache hot at all times.
     */
    private Cache<String, CommitHistory> commitsByRepoCache = createCache(
        name: 'commitsByRepo',
        replicate: true
    )

    private Timer refreshTimer

    void init() {
//        refreshTimer = createTimer(
//            name: 'loadCommits',
//            runFn: this.&loadCommitsForAllRepos,
//            interval: 'gitHubCommitsRefreshMins',
//            intervalUnits: MINUTES,
//            primaryOnly: true
//        )
    }

    void forceRefresh() {
        logInfo("Forced refresh of commit history requested")
        refreshTimer.forceRun()
    }

    /** Return map of all available commit histories, keyed by repo name. */
    Map<String, CommitHistory> getCommitsByRepo() {
        commitsByRepoCache.map
    }

    /** Return cached commit history for a single repo. */
    CommitHistory getCommitsForRepo(String repoName) {
        commitsByRepoCache.get(repoName)
    }


    //------------------
    // Implementation
    //------------------
    private void loadCommitsForAllRepos(Boolean forceFullLoad = false) {
        if (configService.getString('gitHubAccessToken', 'none') == 'none') {
            logWarn('Required "gitHubAccessToken" config not present or set to "none" - no commits will be loaded from GitHub.')
            return
        }

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
    }

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
                    def response = fetchPage(repoName, commitHistory.lastCommitTimestamp, cursor)
                    if (response?.data?.repository?.name != repoName) {
                        throw new RuntimeException("JSON returned by GitHub API not in expected format")
                    }

                    def history = response.data.repository.defaultBranchRef.target.history,
                        pageInfo = history.pageInfo,
                        rawCommits = history.nodes as List<Map>

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

        if (hadError) {
            logError('Error during commit load', 'no commits will be updated')
            return []
        }

        // Always update commit history, even if no new commits were found. This will update the
        // lastUpdated timestamp and confirm we were able to successfully check for commits.
        newCommits = commitHistory.updateWithNewCommits(newCommits)
        logDebug('Commit load complete', "${newCommits.size()} new commits")
        commitsByRepoCache.put(repoName, commitHistory)
        return newCommits
    }

    private Map fetchPage(String repoName, String sinceTimestamp = null, String cursor = null) {
        def query = getQueryJson(repoName, sinceTimestamp, cursor),
            post = new HttpPost('https://api.github.com/graphql')

        post.setHeader('Accept', 'application/json')
        post.setHeader('Content-type', 'application/json')
        post.setHeader('Authorization', "bearer ${configService.getString('gitHubAccessToken')}")
        post.setEntity(new StringEntity(query))

        jsonClient.executeAsMap(post)
    }

    private String getQueryJson(String repoName, String sinceTimestamp, String cursor) {
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
        _jsonClient ?= new JSONClient()
    }

    private void pushUpdate() {
        webSocketService.pushToChannels(
            webSocketService.allChannels*.key, 'gitHubUpdate',
            [timestamp: Instant.now()]
        )
    }

    void clearCaches() {
        _jsonClient = null
        if (isPrimary) {
            commitsByRepoCache.clear()
            forceRefresh()
        }
        super.clearCaches()
    }

    Map getAdminStats() { [
        config: configForAdminStats('gitHubAccessToken', 'gitHubRepos', 'gitHubMaxPagesPerLoad')
    ]}
}
