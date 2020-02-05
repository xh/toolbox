package io.xh.toolbox.roadmap

import io.xh.hoist.json.JSONFormat
import io.xh.hoist.pref.UserPreference

class Phase implements JSONFormat{

    String name = 'Q1 2020'
    Integer sortOrder
    String lastUpdatedBy
    Date lastUpdated

    static hasMany = [projects: Project]

    static mapping = {
        projects lazy: false
        cache true
    }

    static constraints = {
        name(blank: false, maxSize: 50)
        sortOrder(max: 9)
        lastUpdatedBy(nullable: true, maxSize: 50)
    }

    Map formatForJSON() {
        return [
                id: id,
                name: name,
                sortOrder: sortOrder,
                lastUpdatedBy: lastUpdatedBy,
                lastUpdated: lastUpdated,
                projectNames: projects ? projects.name : null,
                projects: projects
        ]
    }
}
