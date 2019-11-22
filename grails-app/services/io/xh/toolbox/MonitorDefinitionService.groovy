package io.xh.toolbox

import io.xh.hoist.BaseService
import io.xh.hoist.monitor.MonitorResult
import io.xh.toolbox.app.FileManagerService

import java.math.MathContext

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

    def newsStoryCount(MonitorResult result) {
        result.metric = newsService.itemCount
    }

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

    def loadedSourcesCount(MonitorResult result) {
        result.metric = newsService.loadedSourcesCount
        result.status = newsService.allSourcesLoaded ? OK : FAIL
    }

    def storageSpaceUsed(MonitorResult result) {
        //sum up the sizes of all uploaded files..
        def bytes = fileManagerService.list()
                .collect {it.length()}
                .sum() ?: 0
        //and convert to megabytes rounded to two decimal places
        def MiB = (bytes / (1024 * 1024)).setScale(2, BigDecimal.ROUND_HALF_UP)
        result.metric = MiB
    }

    def maliciousFilesFound(MonitorResult result) {
        //count how many uploaded files contain .sh or .exe (i.e. look like an executable)
        result.metric = fileManagerService.list()
                .findAll {it.name.matches(".*\\.(sh|exe).*")}
                .size()
    }

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
}
