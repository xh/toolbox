package io.xh.toolbox.user

import io.xh.hoist.user.HoistUser
import org.jasypt.util.password.BasicPasswordEncryptor


class User implements HoistUser {

    private static encryptor = new BasicPasswordEncryptor()

    // Email captured and stored as username.
    String email
    // Nullable password - set for local (non-Oauth) users only.
    String password
    // First/last displayName.
    String name
    // External URL to profile pic - supplied by social login.
    String profilePicUrl

    boolean enabled = true

    static constraints = {
        email blank: false, unique: true, email: true, validator: {
            return validateUsername(it) ?: 'toolbox.user.custom.validation.fail.message'
        }
        name blank: false
        password nullable: true
        profilePicUrl nullable: true, maxSize: 2048
    }

    static mapping = {
        cache true
        table 'tb_user'
        email index: 'idx_tb_user_email'
        password column: '`password`'
    }

    boolean checkPassword(String plainPassword) {
        password ? encryptor.checkPassword(plainPassword, password) : false
    }

    //------------------------------
    // HoistUser overrides
    //-------------------------------
    boolean isActive()      {enabled}
    String getUsername()    {email}
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
