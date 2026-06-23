package io.xh.toolbox.security

import io.xh.hoist.config.TypedConfigMap

/**
 * Typed representation of the `entraIdConfig` soft config - the OAuth client registration for
 * Toolbox at XH's Azure Entra ID tenant, used when testing Entra ID as an alternate OAuth provider.
 *
 * Read server-side via `configService.getObject(EntraIdConfig)` and spread into the client config
 * payload by {@link EntraIdTokenService}.
 */
class EntraIdConfig extends TypedConfigMap {

    /** OAuth client ID for the Toolbox application registered at Entra ID. */
    String clientId = '5d933976-8fe4-40fc-bc13-b9d239a2efe5'

    /** Entra ID tenant ID used to build the authority + JWKS URLs. */
    String tenantId = '51759969-dc12-46ec-a1e9-2532084dc881'

    /**
     * Enable the MSAL client's built-in performance telemetry (hoist-react
     * `MsalClientConfig.enableTelemetry`).
     */
    boolean enableTelemetry = true

    /**
     * Allow the client to re-login interactively (via pop-up) when tokens begin failing to load
     * (hoist-react `BaseOAuthClientConfig.reloginEnabled`).
     */
    boolean reloginEnabled = true

    /**
     * Additional options deep-merged into the underlying MSAL client (hoist-react
     * `MsalClientConfig.msalClientOptions`). Free-form `Partial<msal.Configuration>` bag, providing
     * an escape hatch for any MSAL option not promoted to an explicit field above.
     */
    Map msalClientOptions = [:]

    EntraIdConfig(Map args) { init(args) }
}
