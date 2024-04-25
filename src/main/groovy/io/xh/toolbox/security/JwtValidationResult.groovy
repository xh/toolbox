package io.xh.toolbox.security


class JwtValidationResult extends io.xh.hoist.security.JwtValidationResult {

    /** Additional user info extracted from Auth0 token payload. */
    final String fullName
    final String profilePicUrl

    JwtValidationResult(Map mp) {
        super(mp)
        isValid = mp.sub && mp.email && !mp.exception
        fullName = mp.fullName
        profilePicUrl = mp.profilePicUrl
    }

    Map formatForJSON() {
        return super.formatForJSON() + [
            fullName: fullName,
            profilePicUrl: profilePicUrl
        ]
    }
}
