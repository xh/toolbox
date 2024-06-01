package io.xh.toolbox.roadmap

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class RoadmapController extends BaseController {

    def roadmapService

    def data() {
        renderJSON(data: roadmapService.fetchData())
    }
}
