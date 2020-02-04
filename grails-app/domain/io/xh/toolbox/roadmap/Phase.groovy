package io.xh.toolbox.roadmap

import io.xh.hoist.json.JSONFormat

class Phase implements JSONFormat{

    String name = 'Q1 2020'
    Integer sortOrder
    String lastUpdatedBy
    Date lastUpdated

    static mapping = {
        cache true
    }

    static constraints = {
        name(blank: false, maxSize: 50)
        lastUpdatedBy(nullable: true, maxSize: 50)
    }

    Map formatForJSON() {
        return [
                id: id,
                name: name,
                sortOrder: sortOrder,
                lastUpdatedBy: lastUpdatedBy,
                lastUpdated: lastUpdated
        ]
    }
}
