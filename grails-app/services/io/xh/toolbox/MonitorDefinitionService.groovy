package io.xh.toolbox

import io.xh.hoist.BaseService
import io.xh.hoist.monitor.MonitorResult

import static io.xh.hoist.monitor.MonitorStatus.OK
import static io.xh.hoist.monitor.MonitorStatus.WARN
import static io.xh.hoist.monitor.MonitorStatus.FAIL


class MonitorDefinitionService extends BaseService {

    def foo(MonitorResult result) {
        result.metric = 25
        result.status = OK
    }

    def bar(MonitorResult result) {
        result.metric = 50
        result.status = FAIL
    }

    def sniff(MonitorResult result) {
        result.metric = 13
        result.status = WARN
    }
}
