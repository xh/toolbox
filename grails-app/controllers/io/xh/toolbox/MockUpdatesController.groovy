package io.xh.toolbox

import io.xh.hoist.security.AccessAll

@AccessAll
class MockUpdatesController extends BaseController {

    def mockUpdatesService

    def subscribe(String channelKey) {
        mockUpdatesService.subscribe(channelKey)
        renderJSON(success: true)
    }

    def unsubscribe(String channelKey) {
        mockUpdatesService.unsubscribe(channelKey)
        renderJSON(success: true)
    }

}
