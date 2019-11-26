package io.xh.toolbox

import groovy.time.TimeCategory
import io.xh.hoist.BaseService
import io.xh.hoist.monitor.MonitorResult
import io.xh.hoist.track.TrackLog

import static io.xh.hoist.monitor.MonitorStatus.OK
import static io.xh.hoist.monitor.MonitorStatus.FAIL
import static io.xh.hoist.monitor.MonitorStatus.UNKNOWN
import static io.xh.hoist.monitor.MonitorStatus.WARN
import static io.xh.hoist.util.DateTimeUtils.MINUTES
import static java.lang.Runtime.runtime
import static java.lang.System.currentTimeMillis

class MonitorDefinitionService extends BaseService {

    def newsService
    def fileManagerService
    def recallsService
    def portfolioService

    /**
     * Check the count of news stories loaded by NewsService
     */
    def newsStoryCount(MonitorResult result) {
        result.metric = newsService.itemCount
    }

    /**
     * Check when the last update to the news was fetched.
     * If no news stories have been fetched at all, we consider that a failure.
     */
    def lastUpdateAgeMins(MonitorResult result) {
        if (newsService.lastTimestamp) {
            def diffMs = currentTimeMillis() - newsService.lastTimestamp.time,
                diffHours = Math.floor(diffMs / MINUTES)
            result.metric = diffHours
        } else {
            result.metric = -1;
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
        result.metric = portfolioService.data.rawPositions.size()
    }

    /**
     * Check the current number of instruments in the Portfolio example
     */
    def instrumentCount(MonitorResult result) {
        result.metric = portfolioService.data.instruments.size()
    }

    /**
     * Check when the most recent prices in the Portfolio example were generated
     */
    def pricesAgeMs(MonitorResult result) {
        def now = new Date()
        use (TimeCategory) {
            result.metric = (now - portfolioService.data.timeCreated).toMilliseconds()
        }
    }

    /**
     * Check the longest page load time in the last hour
     */
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
