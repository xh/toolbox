package io.xh.toolbox

import io.xh.hoist.BaseService
import io.xh.hoist.monitor.MonitorResult

import static io.xh.hoist.monitor.MonitorStatus.OK
import static io.xh.hoist.monitor.MonitorStatus.FAIL
import static io.xh.hoist.util.DateTimeUtils.MINUTES
import static java.lang.System.currentTimeMillis

class MonitorDefinitionService extends BaseService {

    def newsService

    def newsStoryCount(MonitorResult result) {
        result.metric = newsService.itemCount
    }

    def lastUpdateAgeMins(MonitorResult result) {
        def diffMs = currentTimeMillis() - newsService.lastTimestamp.time,
            diffHours = Math.floor(diffMs / MINUTES)
        result.metric = diffHours
    }

    def loadedSourcesCount(MonitorResult result) {
        result.metric = newsService.loadedSourcesCount
        result.status = newsService.allSourcesLoaded ? OK : FAIL
    }
}
