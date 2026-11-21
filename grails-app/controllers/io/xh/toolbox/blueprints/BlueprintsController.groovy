package io.xh.toolbox.blueprints

import io.xh.hoist.exception.RoutineRuntimeException
import io.xh.hoist.security.AccessAll
import io.xh.hoist.security.AccessRequiresRole
import io.xh.toolbox.BaseController

import java.time.LocalDate
import java.time.format.DateTimeParseException

@AccessAll
class BlueprintsController extends BaseController {

    def blueprintDataService,
        blueprintSubscriptionService,
        blueprintFeatureRequestService

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

    /** Body: `{request, blueprintType, blueprintId, app}`. Returns `{id}`. */
    def featureRequest() {
        renderJSON(blueprintFeatureRequestService.submit(parseRequestJSON()))
    }

    /** Params: `startDay` and `endDay`, as `YYYY-MM-DD` app days, inclusive. */
    @AccessRequiresRole('HOIST_ADMIN_READER')
    def featureRequests() {
        renderJSON(blueprintFeatureRequestService.list(dayParam('startDay'), dayParam('endDay')))
    }

    private LocalDate dayParam(String name) {
        try {
            return LocalDate.parse(params[name] as String)
        } catch (DateTimeParseException | NullPointerException ignored) {
            throw new RoutineRuntimeException("'$name' must be a day as YYYY-MM-DD")
        }
    }
}
