/**
 * Rsbuild (Rspack + SWC) build configuration - the successor to `webpack.config.js`, driven by
 * `configureRsbuild()` from hoist-dev-utils. Both configs are maintained side-by-side while the
 * bundler migration is evaluated (see hoist-dev-utils #73) - the `env` options are the same.
 *
 * Rsbuild's CLI has no `--env key=value` flag, so build-time overrides arrive as `XH_*`
 * environment variables (e.g. `XH_APP_VERSION=1.2.3 XH_PROD_BUILD=true rsbuild build`) via the
 * `readCliEnv()` helper, or through Rsbuild's own `--env-mode` flag as mapped below.
 *
 * See webpack.config.js for notes on the @xh/package-template custom package example.
 */
import configureRsbuild, {readCliEnv} from '@xh/hoist-dev-utils/configureRsbuild';
import {createRequire} from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url),
    // Single source of truth for the app version - keep in sync with `xhAppVersion` in
    // gradle.properties. Release builds override this via `XH_APP_VERSION`.
    pkg = require('./package.json'),
    customPkgPath = path.resolve('node_modules/@xh/package-template');

export default ({envMode}) => {
    return configureRsbuild({
        appCode: 'toolbox',
        appName: 'Toolbox',
        appVersion: pkg.version,
        favicon: './public/favicon.svg',
        devServerOpenPage: 'app/',
        preloadBackgroundColor: '#f7931c',
        // Use React prod mode, primarily to avoid console warnings for react 18
        reactProdMode: false,
        // Include custom package for transpiling for both packaged and inline use cases.
        babelIncludePaths: [customPkgPath],
        // `rsbuild build --env-mode prod` / `rsbuild dev --env-mode inlineHoist`
        prodBuild: envMode === 'prod',
        inlineHoist: envMode === 'inlineHoist',
        ...readCliEnv()
    });
};
