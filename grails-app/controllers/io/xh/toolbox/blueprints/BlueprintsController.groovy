package io.xh.toolbox.blueprints

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class BlueprintsController extends BaseController {

    def blueprintDataService,
        blueprintSubscriptionService

    def catalog() {
        renderJSON(blueprintDataService.catalogJson)
    }

    def funds() {
        renderJSON(blueprintDataService.funds)
    }

    def data() {
        def req = blueprintDataService.parseRequest(parseRequestJSON())
        renderJSON(rows: blueprintDataService.getRows(req))
    }

    def subscribe() {
        Map body = parseRequestJSON()
        renderJSON(rows: blueprintSubscriptionService.subscribe(body, body.channelKey, body.topic))
    }

    def unsubscribe() {
        Map body = parseRequestJSON()
        blueprintSubscriptionService.unsubscribe(body.channelKey, body.topic)
        renderJSON(success: true)
    }
}
