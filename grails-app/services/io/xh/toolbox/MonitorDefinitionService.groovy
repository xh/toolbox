package io.xh.toolbox

import io.xh.hoist.config.ConfigService
import io.xh.hoist.monitor.MonitorResult
import io.xh.hoist.monitor.provided.DefaultMonitorDefinitionService
import io.xh.toolbox.app.FileManagerService
import io.xh.toolbox.app.GitHubService
import io.xh.toolbox.app.NewsService
import io.xh.toolbox.app.RecallsService
import io.xh.toolbox.portfolio.PortfolioService

import java.time.Duration
import java.time.Instant

import static io.xh.hoist.monitor.MonitorStatus.*
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
                code      : 'divideByZeroMonitor',
                name      : 'Always throws',
                metricType: 'None',
                active    : false
            ],
            [
                code         : 'fileManagerStorageUsedMb',
                name         : 'File Manager: Storage Used',
                metricType   : 'Ceil',
                metricUnit   : 'MB',
                warnThreshold: 16,
                failThreshold: 100,
                active       : true
            ],
            [
                code         : 'gitHubLastUpdateMins',
                name         : 'GitHub: Last Update Check',
                metricType   : 'Ceil',
                metricUnit   : 'minutes since last refresh',
                warnThreshold: 70,
                failThreshold: 140,
                active       : true
            ],
            [
                code         : 'instrumentCount',
                name         : 'Portfolio: Instruments',
                metricType   : 'Floor',
                metricUnit   : 'instruments',
                warnThreshold: 500,
                failThreshold: 1,
                active       : true,
            ],
            [
                code         : 'metric1337Monitor',
                name         : 'Always 1337',
                metricType   : 'Floor',
                failThreshold: 1337,
                active       : true
            ],
            [
                code         : 'newsLastUpdateMins',
                name         : 'News: Last Update Check',
                metricType   : 'Ceil',
                metricUnit   : 'minutes since last story',
                warnThreshold: 2160,
                failThreshold: 4320,
                active       : true,
                primaryOnly  : true
            ],
            [
                code         : 'rawPositionCount',
                name         : 'Portfolio: Raw Positions',
                metricType   : 'Floor',
                metricUnit   : 'positions',
                failThreshold: 1,
                active       : true,
            ],
            [
                code       : 'recallsFetchStatus',
                name       : 'Recalls: API Connection Status',
                metricType : 'None',
                active     : true,
                primaryOnly: true
            ]
        ])
    }


    /** Always fail attempting to divide by zero, to demonstrate built-in exception handling. */
    def divideByZeroMonitor(MonitorResult result) {
        result.message = 'Trying to divide by zero'
        result.metric = 1 / (1 - 1)
    }

    /** Report storage space used by uploaded files in the FileManager app, in megabytes. */
    def fileManagerStorageUsedMb(MonitorResult result) {
        def bytes = fileManagerService.list()
            .sum { it.length() } ?: 0
        result.metric = ((double) (bytes / (1024 * 1024))).round(2)
    }

    /**
     * Report age of the least recently updated GitHub CommitHistory and generally validate that
     * all configured repos have been loaded with at least some commits.
     */
    def gitHubLastUpdateMins(MonitorResult result) {
        def repos = configService.getList('gitHubRepos', []) as List<String>
        Instant leastRecentUpdate = null

        if (repos.empty) {
            result.status = INACTIVE
            result.message = "No GitHub repos configured for loading."
            return
        }

        def missingRepos = []
        repos.each { repo ->
            def commitHistory = gitHubService.getCommitsForRepo(repo)
            if (commitHistory?.size()) {
                leastRecentUpdate = leastRecentUpdate
                    ? [leastRecentUpdate, commitHistory.lastUpdated].min()
                    : commitHistory.lastUpdated
            } else {
                missingRepos << repo
            }
        }

        if (missingRepos) {
            result.status = FAIL
            result.message = "Commit history not loaded for configured repo(s): ${missingRepos.toListString()}"
            return
        }

        result.metric = Duration.between(leastRecentUpdate, Instant.now()).toMinutes()
    }

    /** Count instruments in the Portfolio example. */
    def instrumentCount(MonitorResult result) {
        result.metric = portfolioService.portfolio.instruments.size()
    }

    /** Always returns the value 1337 and a message, to demonstrate the wonders of the number 1337. */
    def metric1337Monitor(MonitorResult result) {
        result.metric = 1337
        result.message = 'This metric is always 1337!'
    }

    /** Report how long ago the latest news update was fetched, or fail if no stories are loaded. */
    def newsLastUpdateMins(MonitorResult result) {
        def lastTimestamp = newsService.lastTimestamp
        if (lastTimestamp) {
            def diffMs = currentTimeMillis() - lastTimestamp.time,
                diffMins = Math.floor(diffMs / MINUTES)
            result.metric = diffMins
        } else {
            result.metric = -1
            result.status = FAIL
            result.message = 'No news stories loaded'
        }
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

    /** Count positions in the Portfolio example. */
    def rawPositionCount(MonitorResult result) {
        result.metric = portfolioService.portfolio.rawPositions.size()
    }


}
