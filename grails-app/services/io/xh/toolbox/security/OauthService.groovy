package io.xh.toolbox.security

import io.xh.hoist.security.oauth.BaseOauthService
import io.xh.hoist.http.JSONClient
import org.apache.hc.client5.http.classic.methods.HttpGet
import org.jose4j.jwk.JsonWebKeySet
import org.jose4j.jwk.VerificationJwkSelector
import org.jose4j.jws.JsonWebSignature

import static io.xh.hoist.json.JSONParser.parseObject
import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig
import static java.lang.System.currentTimeMillis

/**
 * Decodes and validates ID tokens issues by Auth0, the OAuth provider for Toolbox.
 */
class OauthService extends BaseOauthService {

    private JSONClient _jsonClient
    private JsonWebKeySet _jwks

    static clearCachesConfigs = ['xhOauthConfig']

    Map getClientConfig() {
        getInstanceConfig('useOAuth') == 'false' ? [enabled: false] : oauthConfig
    }

    TokenValidationResult validateToken(String token) {
        try {
            if (!token) throw new RuntimeException('Unable to validate JWT - no token provided.')
            logTrace('Validating token', token)

            def jws = new JsonWebSignature()
            jws.setCompactSerialization(token)

            def selector = new VerificationJwkSelector(),
                jwk = selector.select(jws, jsonWebKeySet.jsonWebKeys)
            if (!jwk?.key) throw new RuntimeException('Unable to select valid key for token from loaded JWKS')

            jws.setKey(jwk.key)
            if (!jws.verifySignature()) throw new RuntimeException('Token failed signature validation')

            def payload = parseObject(jws.payload)
            if (payload.aud != clientId) {
                throw new RuntimeException("Token aud value [${payload.aud}] does not match expected value from auth0ClientId config.")
            }
            if (payload.exp < currentTimeMillis()) {
                throw new RuntimeException("Token has expired.")
            }


            def ret = new TokenValidationResult(
                    token: token,
                    sub: payload.sub,
                    username: payload.email,
                    fullName: payload.name,
                    profilePicUrl: payload.picture
            )
            logDebug('Token parsed successfully', [username: ret.username, isValid: ret.isValid, sub: ret.sub, fullName: ret.fullName])
            return ret
        } catch (Exception e) {
            return new TokenValidationResult(token: token, exception: e)
        }
    }


    //------------------------
    // Implementation
    //------------------------
    private JSONClient getClient() {
        _jsonClient ?= new JSONClient()
    }

    private JsonWebKeySet getJsonWebKeySet() {
        if (!_jwks) {
            def url = "https://${domain}/.well-known/jwks.json"
            withInfo(["Fetching JWKS", url]) {
                def jwksJson = client.executeAsString(new HttpGet(url))
                _jwks = new JsonWebKeySet(jwksJson)
                if (!_jwks.jsonWebKeys) {
                    throw new RuntimeException('Unable to build valid key set from remote JWKS endpoint.')
                }
            }
        }

        return _jwks
    }

    private String getClientId() {
        return oauthConfig.clientId
    }

    private String getDomain() {
        return oauthConfig.domain
    }

    void clearCaches() {
        super.clearCaches()
        _jsonClient = null
        _jwks = null
    }
}
