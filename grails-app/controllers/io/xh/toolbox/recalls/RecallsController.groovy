package io.xh.toolbox.recalls

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class RecallsController extends BaseController {

    def recallsService

    def index() {
        log.info('hi')
        def recalls = recallsService.fetchRecalls()
        renderJSON(recalls)
    }
}
