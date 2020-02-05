package io.xh.toolbox.roadmap

import io.xh.hoist.BaseService


class RoadmapService extends BaseService {

    List fetchData() {
        return Phase.list().findAll {it.clientVisible}
    }

}
