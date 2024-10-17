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
    path = require('path');

/** Uncomment below when sourcing @xh/package-template from npm distro (typical usage). */
const customPkgPath = path.resolve('node_modules/@xh/package-template');

/**
 * Uncomment below when developing @xh/package-template (our custom package example) inline.
 * Also uncomment Lines 43-44 below where these values are passed into the webpack config.
 * The package source should be checked out as a sibling of the top-level `toolbox` directory.
 *
 * NOTE that running inline here requires running via `yarn startWithHoist`.
 * (Not entirely clear why that is, exactly. Could use more investigation... - ATM)
 */
// const customPkgPath = path.resolve('../../package-template'),
//     customPkgNodeModules = path.resolve(customPkgPath, 'node_modules'),
//     resolveAliases = {'@xh/package-template': customPkgPath};

module.exports = (env = {}) => {
    return configureWebpack({
        appCode: 'toolbox',
        appName: 'Toolbox',
        appVersion: '5.3.0',
        favicon: './public/favicon.svg',
        devServerOpenPage: 'app/',
        dupePackageCheckExcludes: ['es-abstract', 'tslib'],
        sourceMaps: 'devOnly',
        preloadBackgroundColor: '#f7931c',
        // Use React prod mode, primarily to avoid console warnings for react 18
        reactProdMode: false,
        // Include custom package for babel transpiling for both packaged and inline use cases.
        babelIncludePaths: [customPkgPath],
        // Resolve custom package aliases and exclude nested node_modules for inline local dev only.
        // resolveAliases,
        // babelExcludePaths: [customPkgNodeModules],
        ...env
    });
};
