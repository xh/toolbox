package io.xh.toolbox.gridview

import io.xh.hoist.json.JSONFormat
import io.xh.hoist.json.JSONParser
import io.xh.hoist.user.HoistUser

class GridViewAcl implements JSONFormat {

    private final boolean global
    private final String username
    private final Set<String> roles

    GridViewAcl(Map mp) {
        if (mp.global) {
            global = true
            username = null
            roles = Collections.emptySet()
        } else if (mp.username) {
            global = false
            username = mp.username
            roles = Collections.emptySet()
        } else {
            global = false
            username = null
            roles = mp.roles as Set ?: Collections.emptySet()
        }
    }

    static GridViewAcl createGlobal() {
        return new GridViewAcl(global: true)
    }

    static GridViewAcl createPrivate(String username) {
        return new GridViewAcl(username: username)
    }

    static GridViewAcl parse(String acl, String createdBy) {
        if (!acl) return createPrivate(createdBy)
        if (acl == '*') return createGlobal()
        return new GridViewAcl(JSONParser.parseObject(acl))
    }

    boolean getIsGlobal() { global }

    boolean getIsPrivate() { username != null }

    boolean isPrivateTo(HoistUser user) { user && username == user.username }

    boolean userCanAccess(HoistUser user) {
        if (global) return true
        if (isPrivate) return isPrivateTo(user)
        return roles.any { String role -> user.hasRole(role) }
    }

    Map formatForJSON() {
        return [
            isGlobal : isGlobal,
            isPrivate: isPrivate,
            roles    : roles
        ]
    }

}
