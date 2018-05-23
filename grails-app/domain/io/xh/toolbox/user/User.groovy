package io.xh.toolbox.user

import io.xh.hoist.user.HoistUser
import io.xh.hoist.util.Utils
import org.grails.web.json.JSONArray
import org.jasypt.util.password.BasicPasswordEncryptor


class User implements HoistUser {

    private static encryptor = new BasicPasswordEncryptor()

    String firstName
    String lastName
    String email
    String password
    boolean enabled = true
    boolean isAdmin = false
    // need contact prop?

    static constraints = {
        email email: true, blank: false, unique: true, validator: {
            return validateUsername(it) ?: 'toolbox.user.custom.validation.fail.message'
        }
        password blank: false
    }

    static mapping = {
        cache true
        password column: '`password`'
    }

    boolean checkPassword(String plainPassword) {
        encryptor.checkPassword(plainPassword, password)
    }

    //------------------------------
    // HoistUser overrides
    //-------------------------------
    boolean isActive()      {enabled}
    String getUsername()    {email}
    String getEmail()       {email}
    String getDisplayName() {firstName + ' ' + lastName}

    Set<String> getRoles()  {
        Set ret = isAdmin ? ['HOIST_ADMIN', 'APP_READER'] : []
        if (hasKey('roleReader')) ret << 'APP_READER'
        return ret
    }


    //---------------------
    // Implementation
    //---------------------
    private hasKey(String key) {
        try {
            def config = Utils.configService.getJSONArray(key, new JSONArray())
            return config.contains(username)
        } catch(ignored) {
            return false
        }
    }

    def beforeInsert() {
        encodePassword()
    }

    def beforeUpdate() {
        if (hasChanged('password')) {
            encodePassword()
        }
    }

    private encodePassword() {
        password = encryptor.encryptPassword(password)
    }

    Map formatForJSON() {
        return HoistUser.super.formatForJSON() + [
                id: id,
                firstName: firstName,
                lastName: lastName,
                isAdmin: isAdmin,
                password: '**********'
        ]
    }
}
