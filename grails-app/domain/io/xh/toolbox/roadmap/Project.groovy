package io.xh.toolbox.roadmap

import io.xh.hoist.json.JSONFormat

class Project implements JSONFormat {

    static List STATUSES = ['RELEASED', 'MERGED', 'DEVELOPMENT', 'PLANNED']
    static List CATEGORIES = ['GRIDS', 'DASHBOARDS', 'UPGRADES', 'NEW FEATURES', 'OTHER']

    String name
    String category
    String description
    String releaseVersion
    String status
    String gitLinks
    Integer sortOrder
    String lastUpdatedBy
    Date lastUpdated

    static belongsTo = [phase: Phase]

    static mapping = {
        cache true
        description type: 'text'
    }

    static constraints = {
        name(blank: false, maxSize: 100)
        status(inList: Project.STATUSES)
        releaseVersion(nullable: true)
        gitLinks(nullable: true)
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
                sortOrder: sortOrder,
                phaseName: phase.name,
                phaseOrder: phase.sortOrder,
                lastUpdatedBy: lastUpdatedBy,
                lastUpdated: lastUpdated,
        ]
    }
}
