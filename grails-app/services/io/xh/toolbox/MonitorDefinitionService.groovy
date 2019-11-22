package io.xh.toolbox

import io.xh.hoist.BaseService
import io.xh.hoist.monitor.MonitorResult

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

    /**
     * Check the count of news stories loaded by NewsService
     * @param result
     * @return
     */
    def newsStoryCount(MonitorResult result) {
        result.metric = newsService.itemCount
    }

    /**
     * Check when the last update to the news was fetched.
     * If no news stories have been fetched at all, we consider that a failure.
     * @param result
     * @return
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
     * @param result
     * @return
     */
    def loadedSourcesCount(MonitorResult result) {
        result.metric = newsService.loadedSourcesCount
        result.status = newsService.allSourcesLoaded ? OK : FAIL
    }

    /**
     * Check the storage space used by uploaded files in the FileManager app, in megabytes
     * @param result
     * @return
     */
    def storageSpaceUsed(MonitorResult result) {
        //sum up the sizes of all uploaded files..
        def bytes = fileManagerService.list()
                .collect {it.length()}
                .sum() ?: 0
        //and convert to megabytes rounded to two decimal places
        def MiB = (bytes / (1024 * 1024)).setScale(2, BigDecimal.ROUND_HALF_UP)
        result.metric = MiB
    }

    /**
     * Check whether or not any files that look like executables have been uploaded.
     * @param result
     * @return
     */
    def maliciousFilesFound(MonitorResult result) {
        //count how many uploaded files contain .sh or .exe (i.e. look like an executable)
        result.metric = fileManagerService.list()
                .findAll {it.name.matches(".*\\.(sh|exe).*")}
                .size()
    }

    /**
     * Check whether or not we connected to the FDA server successfully for drug recall information.
     * @param result
     * @return
     */
    def recallsFetchStatus(MonitorResult result) {
        def code = recallsService.getLastResponseCode()
        if (!recallsService.getDoneFetch()) {
            result.message = 'Have not yet tried to fetch recalls.'
            result.status = OK
        } else if (!recallsService.getConnectedSuccessfully()) {
            result.message = 'Could not connect to server.'
            result.status = FAIL
        } else if (code >= 300 && code < 400) {
            result.status = WARN
        } else if (code >= 400) {
            result.status = FAIL
        }
    }

    def memoryUsage(MonitorResult result) {
        result.metric = (Runtime.getRuntime().freeMemory() / Runtime.getRuntime().totalMemory() * 100)
                .setScale(2, BigDecimal.ROUND_HALF_UP)
    }
}
