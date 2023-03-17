package io.xh.toolbox.gridview

import io.xh.hoist.json.JSONFormat
import io.xh.hoist.json.JSONParser
import io.xh.hoist.user.HoistUser

class GridView implements JSONFormat {

    String name
    String createdBy
    String value
    String acl
    String description
    String lastUpdatedBy
    Date dateCreated
    Date lastUpdated

    static constraints = {
        acl nullable: true
        description nullable: true
    }

    static mapping = {
        cache true
        value type: 'text'
    }

    Map getParsedValue() {
        return JSONParser.parseObject(value)
    }

    private GridViewAcl _parsedAcl

    GridViewAcl getParsedAcl() {
        if (!_parsedAcl) {
            _parsedAcl = GridViewAcl.parse(acl, createdBy)
        }
        return _parsedAcl
    }

    boolean getIsGlobal() {
        return parsedAcl.isGlobal
    }

    boolean getIsPrivate() {
        return parsedAcl.isPrivate
    }

    boolean isPrivateTo(HoistUser user) {
        return parsedAcl.isPrivateTo(user)
    }

    boolean userCanAccess(HoistUser user) {
        return parsedAcl.userCanAccess(user)
    }

    Map formatForJSON() {
        return [
            id: id,
            name: name,
            description: description,
            value: parsedValue,
            isGlobal: isGlobal,
            isPrivate: isPrivate,
            createdBy: createdBy,
            dateCreated: dateCreated,
            lastUpdatedBy: lastUpdatedBy,
            lastUpdated: lastUpdated,
            acl: parsedAcl
        ]
    }

    Map formatForAdminJSON() {
        return [
            id: id,
            name: name,
            description: description,
            value: parsedValue,
            isGlobal: isGlobal,
            isPrivate: isPrivate,
            createdBy: createdBy,
            dateCreated: dateCreated,
            lastUpdatedBy: lastUpdatedBy,
            lastUpdated: lastUpdated,
            acl: acl // difference here
        ]
    }
}
