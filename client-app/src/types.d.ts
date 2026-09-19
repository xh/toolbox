/**
 * Module declarations for non-code imports processed by the bundler.
 *
 * `.md` files resolve to their raw text content (via Rspack `asset/source`); append `?url` to
 * an import to get an emitted-file URL instead.
 *
 * hoist-react ships an equivalent `*.md` declaration in its `assets.d.ts`, but that is only
 * pulled in when compiling hoist-react *source* (its asset-importing files carry a
 * triple-slash reference to it). The published `.d.ts` in `node_modules` do not, so an app
 * compiling against the installed package still needs its own declaration here.
 */
declare module '*.md' {
    const content: string;
    export default content;
}

/**
 * Image assets imported by hoist-react components resolved via the `@xh/hoist` paths alias
 * (e.g. `Spinner`, `IdlePanel`). Rsbuild emits these as asset modules at build time, inlining
 * small rasters as data URIs.
 */
declare module '*.png' {
    const url: string;
    export default url;
}

/**
 * Build-time flag injected by hoist-dev-utils via Rsbuild's `source.define`. Prefer
 * `XH.isDevelopmentMode` in app code - reach for this global only where the check must be resolved
 * at build time so the guarded block is dropped from production bundles entirely.
 */
declare const xhIsDevelopmentMode: boolean;
