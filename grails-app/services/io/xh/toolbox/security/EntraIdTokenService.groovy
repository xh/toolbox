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
 * Decodes and validates ID tokens issued by Microsoft Entra ID, a secondary/optional OAuth provider
 * for Toolbox. We use Auth0 and {@link AuthZeroTokenService} by default, but we want Toolbox to be able to
 * process Oauth flow from Entra/MSAL for testing, as that's our most common / important IDP for
 * deployments at our enterprise clients.
 *
 * Switch to EntraId (disabling Auth0) by setting the `oauthProvider` instance config to `ENTRA_ID`.
 * For local dev, set `APP_TOOLBOX_OAUTH_PROVIDER=ENTRA_ID` in your .env file.
 */
class EntraIdTokenService extends BaseService {

    static clearCachesConfigs = ['entraIdConfig']

    AuthenticationService authenticationService
    ConfigService configService

    private JsonWebKeySet _jwks

    Map getClientConfig() {
        return [
            provider: 'ENTRA_ID',
            authority: authority,
            *: config
        ]
    }

    void init() {
        super.init()

        // Fetch JWKS eagerly so it's ready for potential burst of initial requests after startup.
        if (authenticationService.oauthProvider == 'ENTRA_ID') {
            getJsonWebKeySet()
        }
    }

    TokenValidationResult validateToken(String token) {
        if (!token) {
            logTrace('Unable to validate - no token provided')
            return null
        }

        try {
            withTrace(['Validating token', token]) {
                def jws = new JsonWebSignature()
                jws.setCompactSerialization(token)

                def selector = new VerificationJwkSelector(),
                    jwk = selector.select(jws, jsonWebKeySet.jsonWebKeys)
                if (!jwk?.key) throw new RuntimeException('Unable to select valid key for token from loaded JWKS')

                jws.setKey(jwk.key)
                if (!jws.verifySignature()) throw new RuntimeException('Token failed signature validation')
                def payload = parseObject(jws.payload)

                logDebug('Token parsed successfully', payload)

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
                    picture: null // would need to make a graph call to resolve
                )
            }
        } catch (Exception e) {
            logDebug('Exception parsing JWT', e)
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
        def url = "https://login.microsoftonline.com/${tenantId}/discovery/keys?appid=${clientId}"
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
        configService.getMap('entraIdConfig', [:])
    }

    private String getClientId() {
        config.clientId
    }

    private String getTenantId() {
        config.tenantId
    }

    private String getAuthority() {
        return "https://login.microsoftonline.com/${tenantId}"
    }

    void clearCaches() {
        super.clearCaches()
        _jwks = null
    }

    Map getAdminStats() {[
        config: configForAdminStats('entraIdConfig'),
        jwks: jsonWebKeySet.toJson()
    ]}

}
