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

    def symbols() {
        renderJSON(blueprintDataService.symbols)
    }

    def data() {
        def req = blueprintDataService.parseRequest(parseRequestJSON())
        renderJSON(blueprintDataService.query(req))
    }

    def subscribe() {
        Map body = parseRequestJSON()
        renderJSON(blueprintSubscriptionService.subscribe(body, body.channelKey, body.topic))
    }

    def aggregates() {
        Map body = parseRequestJSON()
        renderJSON(aggregates: blueprintSubscriptionService.aggregates(body, body.channelKey, body.topic))
    }

    def unsubscribe() {
        Map body = parseRequestJSON()
        blueprintSubscriptionService.unsubscribe(body.channelKey, body.topic)
        renderJSON(success: true)
    }
}
