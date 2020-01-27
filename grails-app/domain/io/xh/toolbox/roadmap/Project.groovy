package io.xh.toolbox.roadmap

import io.xh.hoist.json.JSONFormat

class Project implements JSONFormat {

    static List STATUSES = ['RELEASED', 'MERGED', 'DEVELOPMENT', 'PLANNED']

    String name
    String category
    String description
    String release
    String status
    String gitLink
    String lastUpdatedBy
    Date lastUpdated

    static mapping = {
        cache true
        description type: 'text'
    }

    static constraints = {
        name(nullable: false, blank: false, maxSize: 50)
        description(nullable: false)
        status(inList: Project.STATUSES)
        lastUpdatedBy(nullable: true, maxSize: 50)
    }

    Map formatForJSON() {
        return [
                id: id,
                name: name,
                description: description,
                release: release,
                status: status,
                gitLink: gitLink,
                lastUpdatedBy: lastUpdatedBy,
                lastUpdated: lastUpdated
        ]
    }
}
