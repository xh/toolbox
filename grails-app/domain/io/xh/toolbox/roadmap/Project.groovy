package io.xh.toolbox.roadmap

import io.xh.hoist.json.JSONFormat

class Project implements JSONFormat {

    static List STATUSES = ['RELEASED', 'MERGED', 'DEVELOPMENT', 'PLANNED']

    String name
    String category
    String description
    String releaseVersion
    String status
//    String gitLink
    String lastUpdatedBy
    Date lastUpdated

    static hasMany = [gitLinks: GitLink]
    static mapping = {
        cache true
        description type: 'text'
    }

    static constraints = {
        name(nullable: false, blank: false, maxSize: 50)
        status(inList: Project.STATUSES)
        releaseVersion(nullable: true)
        lastUpdatedBy(nullable: true, maxSize: 50)
    }

    Map formatForJSON() {
        return [
                id: id,
                category: category,
                name: name,
                description: description,
                releaseVersion: releaseVersion,
                status: status,
                gitLinks: gitLinks,
                lastUpdatedBy: lastUpdatedBy,
                lastUpdated: lastUpdated
        ]
    }
}
