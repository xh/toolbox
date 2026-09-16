/**
 * Toolbox demonstrates the use of a custom JS package (@xh/package-template) that is transpiled
 * and processed alongside the app and hoist-react code. The use of such a package requires some
 * extra configuration entries here in webpack.config.js to instruct Webpack/Babel to process the
 * package JS/SASS. (Like hoist-react, this sample package is left unbundled/uncompiled when
 * published to npm so it can be processed in one shot and with the same tooling as the app.)
 *
 * Note that apps that do NOT make use of such a custom package do NOT need to set the
 * babelIncludePaths, babelExcludePaths, or resolveAliases keys used below.
 */
const configureWebpack = require('@xh/hoist-dev-utils/configureWebpack'),
    path = require('path'),
    // Single source of truth for the app version - keep in sync with `xhAppVersion` in
    // gradle.properties. Release builds override this via `--env appVersion`.
    pkg = require('./package.json');

/** Uncomment below when sourcing @xh/package-template from npm distro (typical usage). */
const customPkgPath = path.resolve('node_modules/@xh/package-template');

/**
 * Uncomment below when developing @xh/package-template (our custom package example) inline.
 * Also uncomment the `@xh/package-template` entry in `resolveAliases` below, and the
 * `babelExcludePaths` entry where that value is passed into the webpack config.
 * The package source should be checked out as a sibling of the top-level `toolbox` directory.
 *
 * NOTE that running inline here requires running via `pnpm startWithHoist`.
 * (Not entirely clear why that is, exactly. Could use more investigation... - ATM)
 */
// const customPkgPath = path.resolve('../../package-template'),
//     customPkgNodeModules = path.resolve(customPkgPath, 'node_modules');

/**
 * Dedupe ag-Grid when running hoist-react inline via `pnpm startWithHoist` - the sibling checkout
 * installs its own copy (ag-Grid is a hoist-react devDependency), and any value crossing between
 * the two copies fails `instanceof` checks. Most visibly the Theming API rejects a theme built by
 * the other copy (AG Grid error #240), leaving the grid unstyled. Both packages export such
 * values, hence both aliases.
 *
 * Inherent to inline dev, not to any one feature. A no-op when packaged, so leave it in place.
 */
const resolveAliases = {
    'ag-grid-community': path.resolve('node_modules/ag-grid-community'),
    'ag-grid-react': path.resolve('node_modules/ag-grid-react')
    // Uncomment when developing @xh/package-template inline - see note above.
    // ,'@xh/package-template': customPkgPath
};

module.exports = (env = {}) => {
    return configureWebpack({
        appCode: 'toolbox',
        appName: 'Toolbox',
        appVersion: pkg.version,
        favicon: './public/favicon.svg',
        devServerOpenPage: 'app/',
        preloadBackgroundColor: '#f7931c',
        // Use React prod mode, primarily to avoid console warnings for react 18
        reactProdMode: false,
        // Include custom package for babel transpiling for both packaged and inline use cases.
        babelIncludePaths: [customPkgPath],
        // Dedupe ag-Grid - see note above.
        resolveAliases,
        // Exclude nested node_modules for inline local dev of the custom package only.
        // babelExcludePaths: [customPkgNodeModules],
        ...env
    });
};
