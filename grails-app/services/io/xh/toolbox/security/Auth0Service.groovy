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
            def jwksJson = '{"keys": [{"kty": "RSA", "use": "sig", "n": "rQxRn6prKsjL_ZSu4oB7NwO74i6hTuaQBcUx0P0_YJDbZc9_5r5NzIxsooW_caCJa_uR0VRrcjFOA35jzRrGuuKS_Z7fRPZf8uawV4j0e1RbHp7odAMq7hB60DOWL1CgcwCkB3uh2w8quHILfEQ_WHbXYHJLjTx84bDvQ-07xk_Pk_l4uv10mdSc3K6oGZFpbbAqptNaUAiUr_LwAaITTROBQvwec5ckN07pqXV0S1k2PUzzqExbjL7NKqoO0QCh9491F-JU4Xb77dfmqQMD1d3Y5bC4K01TrpP8I8Ezj-Y9DYMneBghgLKt0hnZASbW6Z6EmtZ6rH7IhEqRvs_XQQ", "e": "AQAB", "kid": "AnSBZq98n8kTu5ZZVcI6z", "x5t": "h-ngbFtTRUj7_Hk4PEpGEQPz6uk", "x5c": ["MIIC/TCCAeWgAwIBAgIJSGMPmUBy4SFdMA0GCSqGSIb3DQEBCwUAMBwxGjAYBgNVBAMTEXhoaW8udXMuYXV0aDAuY29tMB4XDTIwMDkyNDE1MDkxM1oXDTM0MDYwMzE1MDkxM1owHDEaMBgGA1UEAxMReGhpby51cy5hdXRoMC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCtDFGfqmsqyMv9lK7igHs3A7viLqFO5pAFxTHQ/T9gkNtlz3/mvk3MjGyihb9xoIlr+5HRVGtyMU4DfmPNGsa64pL9nt9E9l/y5rBXiPR7VFsenuh0AyruEHrQM5YvUKBzAKQHe6HbDyq4cgt8RD9YdtdgckuNPHzhsO9D7TvGT8+T+Xi6/XSZ1JzcrqgZkWltsCqm01pQCJSv8vABohNNE4FC/B5zlyQ3TumpdXRLWTY9TPOoTFuMvs0qqg7RAKH3j3UX4lThdvvt1+apAwPV3djlsLgrTVOuk/wjwTOP5j0Ngyd4GCGAsq3SGdkBJtbpnoSa1nqsfsiESpG+z9dBAgMBAAGjQjBAMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFACMb6rB4OR4LcecDazvYolIFAqLMA4GA1UdDwEB/wQEAwIChDANBgkqhkiG9w0BAQsFAAOCAQEAUu3qr9u0wpKus22n1Ugyj3IJRbkaJYkScs6kOforOVMPm6OcaUahhGgn58szc7I6iQcMqJePdDsQPlrs+SFH3RxtPsTq/hzxYTS9q07OfENEMxGUymoKUau41exSl6prF3wkaXpY0iGpzXxjH883sAhfn41ewIC1S8Zpcgg6dz/leOD/MMW2rbngWDAGBT5EAU9w561LPdi/M7/Ahb8JrGqe83sj+N1aSkm5FlJSCZMV9Cx2zfNPe2ivfEfDlVZkl+wwMH0zJ2hPqY/eHXDXOQO01O8r+4TR3h703e+BJL1vpCJT7j/kmjdMyA79Mw+zEBuofmQoWYoEhD+oM7uOiQ=="], "alg": "RS256"}, {"kty": "RSA", "use": "sig", "n": "7p1VbgPkBSDNj-FeYKR-HS8c_kRYjUXXNRV9ilsrG-p_xutfZ5k63FbSZbwcc7uYvmbtJrLy5P-a-yqK_vh_JRljZ_liagizrFcAhZgVFWBjXXJig_ZFvxtvbgZiQEnfwwIWxfamBovj1w1k8913CCD6Q9UA9m9TZE2-a4cvSszJNQJU_I1bJuK9uUhAMx4V9gyKpV9DwvpxJG9Afv7jE0OJu2LrrRL6ghkWCRlOIvhjQLEV2gtBVkUtCoIDiJgsap7yIZzlV957DDtfU3cZFKLrhKJ_ykznhYEuuqzgPMnyMlAb8-3uyQBgIH5t4sh9hzV7tMQyAyT4I8a5ZOaWfw", "e": "AQAB", "kid": "4VZxMAsk-vg3JkJCWkFvM", "x5t": "WGIemR_bZlGPKGonfeSdt2wk-wU", "x5c": ["MIIC/DCCAeSgAwIBAgIIMG9Ibhdgc7AwDQYJKoZIhvcNAQELBQAwHDEaMBgGA1UEAxMReGhpby51cy5hdXRoMC5jb20wHhcNMjAwOTI0MTUwOTEzWhcNMzQwNjAzMTUwOTEzWjAcMRowGAYDVQQDExF4aGlvLnVzLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAO6dVW4D5AUgzY/hXmCkfh0vHP5EWI1F1zUVfYpbKxvqf8brX2eZOtxW0mW8HHO7mL5m7Say8uT/mvsqiv74fyUZY2f5YmoIs6xXAIWYFRVgY11yYoP2Rb8bb24GYkBJ38MCFsX2pgaL49cNZPPddwgg+kPVAPZvU2RNvmuHL0rMyTUCVPyNWybivblIQDMeFfYMiqVfQ8L6cSRvQH7+4xNDibti660S+oIZFgkZTiL4Y0CxFdoLQVZFLQqCA4iYLGqe8iGc5Vfeeww7X1N3GRSi64Sif8pM54WBLrqs4DzJ8jJQG/Pt7skAYCB+beLIfYc1e7TEMgMk+CPGuWTmln8CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUTBZywkBNphjylMftJPsV9Hev/OYwDgYDVR0PAQH/BAQDAgKEMA0GCSqGSIb3DQEBCwUAA4IBAQCpNTXjtJjGVXNIfKH4PSiDq0TRLYaNyMSZ3DvabwFPCyK3a1OmC2vDpcwkrjwHXPacAxHGPDZs0dSkkovLoOEJIn4XX4/sQsiFEo6HNrMMOXwuiCvFXTlIPhBptcEK/Ra5nLqeEp6ijY9i0Qq9fr2ndYD5Y2Vk+UemAej/vhu4SBxW9PkSGnOM9bptQv98gnfJTEmTL/5IrVRmwlMsccDKNzLKfQc5FuqWQPvTxxWrTFEwBBW4tqN3ysAed96OgaQwPoWyGs27heukPmKJ9qFCHZawLOH1/XrNzxOUhylmNEnzVVZ78gLYexHSBAqgGQv8Si1qjO4PHNpQV+Bz6IBl"], "alg": "RS256"}]}', // (new JSONClient()).executeAsString(new HttpGet(url)),
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
