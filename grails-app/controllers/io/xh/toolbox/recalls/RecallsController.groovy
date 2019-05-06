package io.xh.toolbox.recalls

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class RecallsController extends BaseController {

    def recallsService

    def index(String searchQuery) {
        def recalls = recallsService.fetchRecalls(searchQuery)
        renderJSON(recalls)
    }

}
