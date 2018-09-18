package io.xh.toolbox

import io.xh.hoist.BaseService
import io.xh.hoist.monitor.MonitorResult

import java.util.concurrent.TimeUnit

import static io.xh.hoist.monitor.MonitorStatus.OK
import static io.xh.hoist.monitor.MonitorStatus.FAIL


class MonitorDefinitionService extends BaseService {

    def newsService

    def newsStories(MonitorResult result) {
        result.metric = newsService.countStories()
    }

    def lastUpdate(MonitorResult result) {
        Date now = new Date()
        long diffMs = Math.abs(now.getTime() - newsService.getLastTimestamp().getTime())
        long diffHours = TimeUnit.HOURS.convert(diffMs, TimeUnit.MILLISECONDS)
        result.metric = diffHours
    }

    def sourcesLoaded(MonitorResult result) {
        result.metric = newsService.countSourcesLoaded()
        result.status = newsService.sourcesLoaded() ? OK : FAIL
    }


}
