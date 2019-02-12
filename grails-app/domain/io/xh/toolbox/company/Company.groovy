package io.xh.toolbox.company

import io.xh.hoist.json.JSONFormat

class Company implements JSONFormat {

    static List TYPES = ['LLC', 'Partnership', 'Corporation']

    String name
    String type = 'LLC'
    int employees
    boolean isActive = true
    String cfg
    String note
    Date earningsDate
    String lastUpdatedBy
    Date lastUpdated

    static mapping = {
        cache true
        note type: 'text'
        cfg type: 'text'
    }

    static constraints = {
        name(nullable: false, blank: false, maxSize: 50)
        type(inList: Company.TYPES)
        cfg(nullable: true)
        note(nullable: true)
        lastUpdatedBy(nullable: true, maxSize: 50)
    }

    Map formatForJSON() {
        return [
                id: id,
                name: name,
                type: type,
                employees: employees,
                isActive: isActive,
                cfg: cfg,
                earningsDate: earningsDate,
                note: note,
                lastUpdatedBy: lastUpdatedBy,
                lastUpdated: lastUpdated
        ]
    }

}
