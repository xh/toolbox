package io.xh.toolbox

import io.xh.hoist.BaseService
import io.xh.hoist.monitor.MonitorResult

import static io.xh.hoist.monitor.MonitorStatus.OK
import static io.xh.hoist.monitor.MonitorStatus.FAIL
import static io.xh.hoist.util.DateTimeUtils.HOURS
import static java.lang.System.currentTimeMillis

class MonitorDefinitionService extends BaseService {

    def newsService

    def newsStories(MonitorResult result) {
        result.metric = newsService.countStories()
    }

    def lastUpdate(MonitorResult result) {
        def now = currentTimeMillis()
        long diffMs = now - newsService.lastTimestamp.time
        System.out.println(diffMs)
        long diffHours = Math.floor(diffMs/HOURS)
        result.metric = diffHours
    }

    def sourcesLoaded(MonitorResult result) {
        result.metric = newsService.countSourcesLoaded()
        result.status = newsService.sourcesLoaded() ? OK : FAIL
    }
}
