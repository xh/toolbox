package io.xh.toolbox.user

import io.xh.hoist.user.HoistUser
import org.jasypt.util.password.BasicPasswordEncryptor


class User implements HoistUser {

    private static encryptor = new BasicPasswordEncryptor()

    // Local username (in email format) or OAuth-provided sub (unique user ID).
    String username
    // Nullable password - set for local (non-Oauth) users only.
    String password
    // First/last displayName.
    String name
    String email
    String profilePicUrl
    boolean enabled = true

    static constraints = {
        username blank: false, unique: true, validator: {
            return validateUsername(it) ?: 'toolbox.user.custom.validation.fail.message'
        }
        email email: true, nullable: true
        name blank: false
        password nullable: true
        profilePicUrl nullable: true
    }

    static mapping = {
        cache true
        username index: 'idx_xh_user_username'
        password column: '`password`'
    }

    boolean checkPassword(String plainPassword) {
        password ? encryptor.checkPassword(plainPassword, password) : false
    }

    //------------------------------
    // HoistUser overrides
    //-------------------------------
    boolean isActive()      {enabled}
    String getEmail()       {email}
    String getDisplayName() {name}

    //---------------------
    // Implementation
    //---------------------
    def beforeInsert() {
        encodePassword()
    }

    def beforeUpdate() {
        if (hasChanged('password')) {
            encodePassword()
        }
    }

    private encodePassword() {
        password = password ? encryptor.encryptPassword(password) : null
    }

    Map formatForJSON() {
        return HoistUser.super.formatForJSON() + [
            id: id,
            password: password ? '**********' : 'NONE',
            profilePicUrl: profilePicUrl
        ]
    }
}
