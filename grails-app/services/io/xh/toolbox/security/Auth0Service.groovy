package io.xh.toolbox.security

import groovy.util.logging.Slf4j
import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.json.JSONParser
import io.xh.hoist.json.JSONSerializer
import org.jose4j.jwk.JsonWebKeySet
import org.jose4j.jwk.VerificationJwkSelector
import org.jose4j.jws.JsonWebSignature

import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig

/**
 * Decodes and validates ID tokens issues by Auth0, the OAuth provider for Toolbox.
 */
@Slf4j
class Auth0Service extends BaseService {


    static clearCachesConfigs = ['auth0Domain', 'auth0ClientId', 'auth0Jwks']

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
    private JsonWebKeySet _jkws
    JsonWebKeySet getJsonWebKeySet() {
        if (!_jkws) {
            // Yes, this is a bit odd - we get a JSON config then re-serialize to JSON to pass to
            // JWKS ctor. Could store as string config, but keeping as JSON in configService gives
            // us a nicer UI to view/update in admin console.
            def jwksJson = JSONSerializer.serialize(configService.getMap('auth0Jwks'))
            _jkws = new JsonWebKeySet(jwksJson)

            if (!_jkws.jsonWebKeys.size()) {
                throw new RuntimeException("Unable to build valid key set from 'auth0Jwks' app config")
            }
        }

        return _jkws
    }

    private String getClientId() {
        return configService.getString('auth0ClientId')
    }

    private String getDomain() {
        return configService.getString('auth0Domain')
    }

    void clearCaches() {
        _jkws = null
    }

}
