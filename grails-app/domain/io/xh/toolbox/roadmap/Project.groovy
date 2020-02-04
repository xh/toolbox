package io.xh.toolbox.roadmap

import io.xh.hoist.json.JSONFormat
import io.xh.hoist.util.Utils

class Project implements JSONFormat {

    static List STATUSES = ['RELEASED', 'MERGED', 'DEVELOPMENT', 'PLANNED']
    static List CATEGORIES = ['GRIDS', 'DASHBOARDS', 'UPGRADES', 'NEW FEATURES', 'OTHER']

    String name
    String category
    String description
    String releaseVersion
    String status
    String gitLinks
    String lastUpdatedBy
    Date lastUpdated

    static belongsTo = [phase: Phase]

    static mapping = {
        cache true
        description type: 'text'
    }

    static constraints = {
        name(blank: false, maxSize: 50)
        status(inList: Project.STATUSES)
        category(inList: Project.CATEGORIES)
        releaseVersion(nullable: true)
        gitLinks(nullable: true, validator: {Utils.isJSON(it) ?: 'default.invalid.json.message'})
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
                lastUpdated: lastUpdated,
                phaseName: phase.name
        ]
    }
}
