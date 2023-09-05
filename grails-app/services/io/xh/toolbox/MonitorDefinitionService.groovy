package io.xh.toolbox

import grails.gorm.transactions.ReadOnly
import groovy.time.TimeCategory
import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.monitor.MonitorResult
import io.xh.hoist.track.TrackLog
import io.xh.toolbox.app.FileManagerService
import io.xh.toolbox.app.GitHubService
import io.xh.toolbox.app.NewsService
import io.xh.toolbox.app.RecallsService
import io.xh.toolbox.github.CommitHistory
import io.xh.toolbox.portfolio.PortfolioService


import static io.xh.hoist.monitor.MonitorStatus.OK
import static io.xh.hoist.monitor.MonitorStatus.FAIL
import static io.xh.hoist.monitor.MonitorStatus.WARN
import static io.xh.hoist.monitor.MonitorStatus.INACTIVE
import static io.xh.hoist.util.DateTimeUtils.MINUTES
import static java.lang.Runtime.runtime
import static java.lang.System.currentTimeMillis

class MonitorDefinitionService extends BaseService {

    ConfigService configService
    FileManagerService fileManagerService
    GitHubService gitHubService
    NewsService newsService
    PortfolioService portfolioService
    RecallsService recallsService

    /**
     * Check the count of news stories loaded by NewsService
     */
    def newsStoryCount(MonitorResult result) {
        result.metric = newsService.itemCount
    }

    /**
     * Always returns the value 1337 and a message
     */
    def metric1337Monitor(MonitorResult result) {
        result.metric = 1337
        result.message = 'This metric is always 1337!'
    }

    /**
     * A monitor that attempts to divide by zero
     */
    def divideByZeroMonitor(MonitorResult result){
        result.message = 'Trying to divide by zero'
        result.metric = 1 / (1-1)
    }

    /**
     * Check when the last update to the news was fetched.
     * If no news stories have been fetched at all, we consider that a failure.
     */
    def lastUpdateAgeMins(MonitorResult result) {
        if (newsService.lastTimestamp) {
            def diffMs = currentTimeMillis() - newsService.lastTimestamp.time,
                diffMins = Math.floor(diffMs / MINUTES)
            result.metric = diffMins
        } else {
            result.metric = -1
            result.status = FAIL
            result.message = 'Have not yet loaded any stories'
        }
    }

    /**
     * Check whether or not the NewsService has loaded stories from all its sources.
     */
    def loadedSourcesCount(MonitorResult result) {
        result.metric = newsService.loadedSourcesCount
        result.status = newsService.allSourcesLoaded ? OK : FAIL
    }

    /**
     * Check the storage space used by uploaded files in the FileManager app, in megabytes
     */
    def storageSpaceUsed(MonitorResult result) {
        // sum up the sizes of all uploaded files as MB
        def bytes = fileManagerService.list()
                .sum {it.length()} ?: 0
        result.metric = ((double)(bytes / (1024 * 1024))).round(2)
    }

    /**
     * Check whether or not we connected to the FDA server successfully for drug recall information.
     */
    def recallsFetchStatus(MonitorResult result) {
        recallsService.fetchRecalls('')
        def code = recallsService.lastResponseCode
        if (!code) {
            result.message = 'Could not connect to server.'
            result.status = FAIL
        } else if (code >= 300 && code < 400) {
            result.status = WARN
        } else if (code >= 400) {
            result.status = FAIL
        }
    }

    /**
     * Check the current memory usage of the server machine (in %)
     */
    def memoryUsage(MonitorResult result) {
        result.metric = ((double) (runtime.freeMemory() / runtime.totalMemory() * 100))
                .round(2)
    }

    /**
     * Check the current number of positions in the Portfolio example
     */
    def positionCount(MonitorResult result) {
        result.metric = portfolioService.portfolio.rawPositions.size()
    }

    /**
     * Check the current number of instruments in the Portfolio example
     */
    def instrumentCount(MonitorResult result) {
        result.metric = portfolioService.portfolio.instruments.size()
    }

    /**
     * Check when the most recent prices in the Portfolio example were generated
     */
    def pricesAgeMs(MonitorResult result) {
        result.metric = currentTimeMillis() - portfolioService.portfolio.timeCreated.time
    }

    /**
     * Count the number of commits loaded from GitHub.
     */
    def gitHubCommitCount(MonitorResult result) {
        def repos = configService.getList('gitHubRepos', []),
            commitCount = 0

        if (repos.empty) {
            result.status = INACTIVE
            result.message = "No GitHub repos configured for loading."
            return
        }

        repos.each {repo ->
            commitCount += gitHubService.getCommitsForRepo(repo).commits.size()
        }

        result.metric = commitCount
        result.message = "Loaded ${commitCount} commits from ${repos.size()} repos."
    }

    /**
     * Check the age of the most recent commit loaded from GitHub.
     */
    def gitHubMostRecentCommitAgeMins(MonitorResult result) {
        def repos = configService.getList('gitHubRepos', []),
            maxDate = null

        if (repos.empty) {
            result.status = INACTIVE
            result.message = "No GitHub repos configured for loading."
            return
        }

        repos.each {repo ->
            def commitHistory = gitHubService.getCommitsForRepo(repo)
            maxDate = [maxDate, commitHistory.commits.first()?.committedDate].max()
        }

        if (maxDate) {
            def diffMs = currentTimeMillis() - maxDate.time,
                diffMins = Math.floor(diffMs / MINUTES)
            result.metric = diffMins
            result.message = "Latest commit @ ${maxDate.format('MMM d h:mma zzz')}"
        } else {
            result.status = FAIL
            result.message = "Commits not loaded, or could not determine latest commit."
        }
    }

    /**
     * Check the longest page load time in the last hour
     */
    @ReadOnly
    def longestPageLoadMs(MonitorResult result) {
        def now = new Date()
        def earlier = null
        use (TimeCategory) {
            earlier = now - 1.hours
        }
        def worstLoadTime = TrackLog.withCriteria {between('dateCreated', earlier, now)}.max{it.elapsed}?.elapsed
        result.metric = worstLoadTime ?: 0
    }
}
