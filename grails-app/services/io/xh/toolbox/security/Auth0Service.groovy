package io.xh.toolbox.security

import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.http.JSONClient
import org.apache.hc.client5.http.classic.methods.HttpGet
import org.jose4j.jwk.JsonWebKeySet
import org.jose4j.jwk.VerificationJwkSelector
import org.jose4j.jws.JsonWebSignature

import static io.xh.hoist.json.JSONParser.parseObject
import static java.lang.System.currentTimeMillis

/**
 * Decodes and validates ID tokens issues by Auth0, the OAuth provider for Toolbox.
 */
class Auth0Service extends BaseService {

    static clearCachesConfigs = ['auth0Config']

    ConfigService configService

    private JsonWebKeySet _jwks

    Map getClientConfig() {
        configService.getMap('auth0Config', [:])
    }

    void init() {
        super.init()
        // Fetch JWKS eagerly so it's ready for potential burst of initial requests after startup.
        getJsonWebKeySet()
    }

    TokenValidationResult validateToken(String token) {
        if (!token) {
            logTrace('Unable to validate - no token provided')
            return null
        }

        try {
            logTrace('Validating token', token)

            def jws = new JsonWebSignature()
            jws.setCompactSerialization(token)

            def selector = new VerificationJwkSelector(),
                jwk = selector.select(jws, jsonWebKeySet.jsonWebKeys)
            if (!jwk?.key) throw new RuntimeException('Unable to select valid key for token from loaded JWKS')

            jws.setKey(jwk.key)
            if (!jws.verifySignature()) throw new RuntimeException('Token failed signature validation')
            def payload = parseObject(jws.payload)

            logDebug('Token parsed successfully', [
                email: payload.email,
                name: payload.name,
                sub: payload.sub,
                aud: payload.aud,
                exp: payload.exp
            ])

            if (payload.aud != clientId) {
                throw new RuntimeException('Token aud value does not match expected value from clientId')
            }
            if (payload.exp * 1000L < currentTimeMillis()) {
                throw new RuntimeException('Token has expired')
            }
            if (!payload.sub || !payload.email) {
                throw new RuntimeException('Token is missing sub or email')
            }

            return new TokenValidationResult(
                email: payload.email,
                name: payload.name,
                picture: payload.picture
            )
        } catch (Exception e) {
            logError('Exception parsing JWT', e)
            return null
        }
    }

    //------------------------
    // Implementation
    //------------------------
    private JsonWebKeySet getJsonWebKeySet() {
        _jwks ?= createKeySet()
    }

    private JsonWebKeySet createKeySet() {
        def url = "https://$domain/.well-known/jwks.json"
        withInfo(['Fetching JWKS', url]) {
            def jwksJson = (new JSONClient()).executeAsString(new HttpGet(url)),
                ret = new JsonWebKeySet(jwksJson)
            if (!ret.jsonWebKeys) {
                throw new RuntimeException('Unable to build valid key set from remote JWKS endpoint.')
            }
            return ret
        }
    }

    private getConfig() {
        configService.getMap('auth0Config')
    }

    private String getClientId() {
        config.clientId
    }

    private String getDomain() {
        config.domain
    }

    void clearCaches() {
        super.clearCaches()
        _jwks = null
    }

    Map getAdminStats() {[
        config: configForAdminStats('auth0Config'),
        jwks: jsonWebKeySet.toJson()
    ]}
}
