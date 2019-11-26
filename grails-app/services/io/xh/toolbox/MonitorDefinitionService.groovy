package io.xh.toolbox

import io.xh.hoist.BaseService
import io.xh.hoist.monitor.MonitorResult
import io.xh.hoist.track.TrackLog

import static io.xh.hoist.monitor.MonitorStatus.OK
import static io.xh.hoist.monitor.MonitorStatus.FAIL
import static io.xh.hoist.monitor.MonitorStatus.UNKNOWN
import static io.xh.hoist.monitor.MonitorStatus.WARN
import static io.xh.hoist.util.DateTimeUtils.MINUTES
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
        // sum up the sizes of all uploaded files..
        def bytes = fileManagerService.list()
                .sum {it.length()} ?: 0
        // and convert to megabytes rounded to two decimal places
        def MB = ((double)(bytes / (1024 * 1024))).round(2)
        result.metric = MB
    }

    /**
     * Check whether or not we connected to the FDA server successfully for drug recall information.
     */
    def recallsFetchStatus(MonitorResult result) {
        recallsService.fetchRecalls('')
        def code = recallsService.getLastResponseCode()
        if (code == null) {
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
        result.metric = ((double)(Runtime.runtime.freeMemory() / Runtime.runtime.totalMemory() * 100))
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
     * Check the 99% latency of client page loads
     */
    def ninetyninthPercentileLatency(MonitorResult result) {
        def latencies = TrackLog.findAll(max: 5000, sort: 'dateCreated', order: 'desc')
                        .collect{it.elapsed}.sort()
        def count = latencies.size()
        def ninetyninth = (int)(count * 0.99)
        result.metric = (count > 0) ? latencies.get(ninetyninth) : 0
    }
}
