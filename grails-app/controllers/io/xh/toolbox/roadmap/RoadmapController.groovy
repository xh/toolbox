package io.xh.toolbox.roadmap

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class RoadmapController extends BaseController {

    def roadmapService

    def data() {
        renderJSON(data: roadmapService.fetchData())
    }
}
