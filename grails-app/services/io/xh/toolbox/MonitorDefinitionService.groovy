package io.xh.toolbox

import io.xh.hoist.config.ConfigService
import io.xh.hoist.monitor.MonitorResult
import io.xh.hoist.monitor.provided.DefaultMonitorDefinitionService
import io.xh.toolbox.app.FileManagerService
import io.xh.toolbox.app.GitHubService
import io.xh.toolbox.app.NewsService
import io.xh.toolbox.app.RecallsService
import io.xh.toolbox.portfolio.PortfolioService

import static io.xh.hoist.monitor.MonitorStatus.OK
import static io.xh.hoist.monitor.MonitorStatus.FAIL
import static io.xh.hoist.monitor.MonitorStatus.WARN
import static io.xh.hoist.monitor.MonitorStatus.INACTIVE
import static io.xh.hoist.util.DateTimeUtils.MINUTES
import static java.lang.System.currentTimeMillis

class MonitorDefinitionService extends DefaultMonitorDefinitionService {

    ConfigService configService
    FileManagerService fileManagerService
    GitHubService gitHubService
    NewsService newsService
    PortfolioService portfolioService
    RecallsService recallsService

    @Override
    void init() {
        super.init()

        ensureRequiredMonitorsCreated([
            [
                    code: 'newsLastUpdateMins',
                    name: 'News: Most Recent Story',
                    metricType: 'Ceil',
                    metricUnit: 'minutes since last story',
                    warnThreshold: 2160,
                    failThreshold: 4320,
                    active: true,
                    primaryOnly: true
            ],
            [
                    code: 'newsStoryCount',
                    name: 'News: Story Count',
                    metricType: 'Floor',
                    metricUnit: 'stories',
                    failThreshold: 1,
                    active: true,
                    primaryOnly: true
            ],
            [
                    code: 'newsLoadedSourcesCount',
                    name: 'News: Loaded Sources',
                    metricType: 'Floor',
                    metricUnit: 'sources',
                    failThreshold: 1,
                    active: true,
                    primaryOnly: true
            ],
            [
                    code: 'fileManagerStorageUsedMb',
                    name: 'File Manager: Storage Used',
                    metricType: 'Ceil',
                    metricUnit: 'MB',
                    warnThreshold: 16,
                    failThreshold: 100,
                    active: true
            ],
            [
                    code: 'recallsFetchStatus',
                    name: 'Recalls: API Connection Status',
                    metricType: 'None',
                    active: true,
                    primaryOnly: true
            ],
            [
                    code: 'rawPositionCount',
                    name: 'Portfolio: Raw Positions',
                    metricType: 'Floor',
                    metricUnit: 'positions',
                    failThreshold: 1,
                    active: true,
            ],
            [
                    code: 'instrumentCount',
                    name: 'Portfolio: Instruments',
                    metricType: 'Floor',
                    metricUnit: 'instruments',
                    warnThreshold: 500,
                    failThreshold: 1,
                    active: true,
            ],
            [
                    code: 'gitHubCommitCount',
                    name: 'GitHub: Loaded Commits',
                    metricType: 'Floor',
                    metricUnit: 'commits',
                    warnThreshold: 100,
                    failThreshold: 1,
                    active: true,
                    primaryOnly: true
            ],
            [
                    code: 'gitHubMostRecentCommitAgeMins',
                    name: 'GitHub: Most Recent Commit',
                    metricType: 'Ceil',
                    metricUnit: 'minutes ago',
                    warnThreshold: 5760,
                    failThreshold: 11520,
                    active: true,
                    primaryOnly: true
            ],
            [
                    code: 'metric1337Monitor',
                    name: 'Always 1337',
                    metricType: 'Floor',
                    failThreshold: 1337,
                    active: true
            ],
            [
                    code: 'divideByZeroMonitor',
                    name: 'Always throws',
                    metricType: 'None',
                    active: false
            ]
        ])

    }

    /** Report when the latest news update was fetched, or fail if no stories are loaded. */
    def newsLastUpdateMins(MonitorResult result) {
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

    /** Count news stories loaded by NewsService. */
    def newsStoryCount(MonitorResult result) {
        result.metric = newsService.itemCount
    }

    /** Check if NewsService has loaded stories from all its sources. */
    def newsLoadedSourcesCount(MonitorResult result) {
        result.metric = newsService.loadedSourcesCount
        result.status = newsService.allSourcesLoaded ? OK : FAIL
    }

    /** Storage space used by uploaded files in the FileManager app, in megabytes. */
    def fileManagerStorageUsedMb(MonitorResult result) {
        // sum up the sizes of all uploaded files as MB
        def bytes = fileManagerService.list()
                .sum {it.length()} ?: 0
        result.metric = ((double)(bytes / (1024 * 1024))).round(2)
    }

    /** Check ability to connect to the FDA API for drug recall example app. */
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

    /** Count of positions in the Portfolio example. */
    def rawPositionCount(MonitorResult result) {
        result.metric = portfolioService.portfolio.rawPositions.size()
    }

    /** Count of instruments in the Portfolio example. */
    def instrumentCount(MonitorResult result) {
        result.metric = portfolioService.portfolio.instruments.size()
    }

    /** Count of commits loaded from GitHub. */
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

    /** Age of the most recent commit loaded from GitHub, in minutes. */
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

    /** Attempt to divide by zero, to demonstrate built-in exception handling. */
    def divideByZeroMonitor(MonitorResult result){
        result.message = 'Trying to divide by zero'
        result.metric = 1 / (1-1)
    }

    /** Always returns the value 1337 and a message, to demonstrate the wonders of the number 1337. */
    def metric1337Monitor(MonitorResult result) {
        result.metric = 1337
        result.message = 'This metric is always 1337!'
    }

}
