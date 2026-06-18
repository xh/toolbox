package io.xh.toolbox

import io.xh.hoist.security.AccessAll

import static io.xh.hoist.util.ClusterUtils.runOnAllInstances

@AccessAll
class MockUpdatesController extends BaseController {

    def mockUpdatesService

    def subscribeLocal(String channelKey) {
        mockUpdatesService.subscribe(channelKey)
        renderJSON(success: true)
    }

    def unsubscribeLocal(String channelKey) {
        mockUpdatesService.unsubscribe(channelKey)
        renderJSON(success: true)
    }

    def subscribeCluster(String channelKey) {
        runOnAllInstances(mockUpdatesService.&subscribe, [channelKey])
        renderJSON(success: true)
    }

    def unsubscribeCluster(String channelKey) {
        runOnAllInstances(mockUpdatesService.&unsubscribe, [channelKey])
        renderJSON(success: true)
    }

}
