package io.xh.toolbox.security

import io.xh.hoist.json.JSONFormat

class JwtValidationResult implements JSONFormat {

    /** The Auth0-issued JWT that was validated. */
    final String idToken
    /** True if the token was determined to be valid and should be trusted. */
    final boolean isValid

    /** User info extracted from token payload. */
    final String sub
    final String email
    final String fullName
    final String profilePicUrl

    /** Exception (if any) encountered while attempting to validate the token. */
    final Exception exception
    /** Date token was validated by Toolbox. */
    final Date dateCreated

    JwtValidationResult(Map mp) {
        idToken = mp.idToken
        isValid = mp.sub && mp.email && !mp.exception
        sub = mp.sub
        email = mp.email?.toLowerCase()
        fullName = mp.fullName
        profilePicUrl = mp.profilePicUrl
        exception = mp.exception as Exception
        dateCreated = new Date()
    }

    Map formatForJSON() {
        return [
            idToken: idToken,
            isValid: isValid,
            sub: sub,
            email: email,
            fullName: fullName,
            profilePicUrl: profilePicUrl,
            exception: exception,
            dateCreated: dateCreated
        ]
    }
}
