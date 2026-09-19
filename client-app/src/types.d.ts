/**
 * Ambient declarations for this app.
 *
 * Note that asset imports (`.md`, `.png`, `.svg`, etc.) need no declaration here - hoist-react's
 * `assets.d.ts` declares them, and its asset-importing source files pull it in via triple-slash
 * reference, making those declarations global for any app compiling against the package.
 */

/**
 * Build-time flag injected by hoist-dev-utils via Rsbuild's `source.define`. Prefer
 * `XH.isDevelopmentMode` in app code - reach for this global only where the check must be resolved
 * at build time so the guarded block is dropped from production bundles entirely.
 */
declare const xhIsDevelopmentMode: boolean;
