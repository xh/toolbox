package io.xh.toolbox.recalls

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class RecallsController extends BaseController {

    def recallsService

    def index() {

        def recalls = recallsService.fetchRecalls()
        renderJSON(recalls)

        // or is it better to write:
        // renderJSON(recallsService.fetchRecalls())
        // ??
    }

    def search() {
        def searchResults = recallsService.fetchSearch(params.drugName)
        // params are case sEnSiTiVe
        renderJSON(searchResults)
    }
}
