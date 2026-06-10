/**
 * Module declarations for non-code imports processed by webpack.
 *
 * `.md` files resolve to their raw text content (hoist-dev-utils v13+, via Webpack
 * `asset/source`); append `?url` to an import to get an emitted-file URL instead.
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
