package io.xh.toolbox.security

import groovy.util.logging.Slf4j
import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.http.JSONClient
import io.xh.hoist.json.JSONParser
import io.xh.hoist.json.JSONSerializer
import org.apache.hc.client5.http.classic.methods.HttpGet
import org.jose4j.jwk.JsonWebKeySet
import org.jose4j.jwk.VerificationJwkSelector
import org.jose4j.jws.JsonWebSignature


import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig

/**
 * Decodes and validates ID tokens issues by Auth0, the OAuth provider for Toolbox.
 */
@Slf4j
class Auth0Service extends BaseService {

    private JSONClient _jsonClient

    static clearCachesConfigs = ['auth0Domain', 'auth0ClientId']

    ConfigService configService

    Map getClientConfig() {
        return [
            clientId: clientId,
            domain: domain
        ]
    }

    JwtValidationResult validateToken(String token) {
        try {
            if (!token) throw new JwtException("Unable to validate JWT - no token provided.")

            def jws = new JsonWebSignature()
            jws.setCompactSerialization(token)

            def selector = new VerificationJwkSelector(),
                jwk = selector.select(jws, jsonWebKeySet.jsonWebKeys)
            if (!jwk?.key) throw new JwtException("Unable to select valid key for token from loaded JWKS")

            jws.setKey(jwk.key)
            if (!jws.verifySignature()) throw new JwtException("Token failed signature validation")

            def payload = JSONParser.parseObject(jws.payload)
            if (payload.aud != this.clientId) {
                throw new JwtException("Token aud value [${payload.aud}] does not match expected value from auth0ClientId config.")
            }

            return new JwtValidationResult(
                token: token,
                sub: payload.sub,
                email: payload.email,
                fullName: payload.name,
                profilePicUrl: payload.picture
            )

        } catch (e) {
            return new JwtValidationResult(token: token, exception: e)
        }
    }


    //------------------------
    // Implementation
    //------------------------
    private JSONClient getClient() {
        if (!_jsonClient) {
            _jsonClient = new JSONClient()
        }
        return _jsonClient
    }

    private JsonWebKeySet _jwks
    JsonWebKeySet getJsonWebKeySet() {
        if (!_jwks) {
            def url = "https://${domain}/.well-known/jwks.json",
                jwksJson = client.executeAsString(new HttpGet(url))
            _jwks = new JsonWebKeySet(jwksJson)

            if (!_jwks.jsonWebKeys.size()) {
                throw new RuntimeException("Unable to build valid key set from remote JWKS endpoint.")
            }
        }

        return _jwks
    }

    private String getClientId() {
        return configService.getString('auth0ClientId')
    }

    private String getDomain() {
        return configService.getString('auth0Domain')
    }

    void clearCaches() {
        super.clearCaches()
        _jsonClient = null
        _jwks = null
    }

}
