const configureWebpack = require('@xh/hoist-dev-utils/configureWebpack'),
    path = require('path');

// Uncomment below when sourcing @xh/package-template from npm distro (typical usage).
const customPkgPath = path.resolve('node_modules/@xh/package-template');

// Uncomment below when developing @xh/package-template (our custom package example) inline.
// Also uncomment Lines 25-26 below.
// Note that running inline here requires running via `yarn startWithHoist`.
// const customPkgPath = path.resolve('../../package-template'),
//     customPkgNodeModules = path.resolve(customPkgPath, 'node_modules'),
//     resolveAliases = {'@xh/package-template': customPkgPath};

module.exports = (env = {}) => {
    return configureWebpack({
        appCode: 'toolbox',
        appName: 'Toolbox',
        appVersion: env.appVersion || '3.0-SNAPSHOT',
        favicon: './public/favicon.png',
        devServerOpenPage: 'app/',
        dupePackageCheckExcludes: ['es-abstract'],
        // Include custom package for babel transpiling for both packaged and inline use cases.
        babelIncludePaths: [customPkgPath],
        // Resolve custom package aliases and exclude nested node_modules for inline local dev only.
        // resolveAliases,
        // babelExcludePaths: [customPkgNodeModules],
        ...env
    });
};
