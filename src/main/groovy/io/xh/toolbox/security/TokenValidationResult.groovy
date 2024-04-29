package io.xh.toolbox.security


class TokenValidationResult extends io.xh.hoist.security.oauth.TokenValidationResult {

    final String fullName
    final String profilePicUrl

    TokenValidationResult(Map mp) {
        super(mp)
        fullName = mp.fullName
        profilePicUrl = mp.profilePicUrl
    }

    String getEmail() {
        return username
    }

    Map formatForJSON() {
        return super.formatForJSON() + [
            email: email,
            fullName: fullName,
            profilePicUrl: profilePicUrl
        ]
    }
}
