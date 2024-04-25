package io.xh.toolbox.roadmap

import grails.gorm.transactions.ReadOnly
import io.xh.hoist.BaseService


class RoadmapService extends BaseService {

    @ReadOnly
    List fetchData() {
        return Phase.list().findAll {it.displayed}
    }

}
