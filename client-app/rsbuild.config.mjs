/**
 * Rsbuild (Rspack + SWC) build configuration, driven by `configureRsbuild()` from hoist-dev-utils.
 * Run via `pnpm start` / `pnpm build` (see package.json scripts).
 *
 * Rsbuild's CLI has no `--env key=value` flag, so build-time overrides arrive as `XH_*`
 * environment variables (e.g. `XH_APP_VERSION=1.2.3 rsbuild build --env-mode prod`) via the
 * `readCliEnv()` helper, or through Rsbuild's own `--env-mode` flag as mapped below. Per-developer
 * defaults such as `XH_DEV_HOST` belong in a gitignored `.env.local`, which Rsbuild loads on every run.
 *
 * Toolbox demonstrates the use of a custom TS package (@xh/package-template) that is transpiled
 * and processed alongside the app and hoist-react code. Like hoist-react, this sample package is
 * left unbundled/uncompiled when published to npm so it can be processed in one shot and with the
 * same tooling as the app - hence the `extraIncludePaths` entry below. Apps that do NOT make use of
 * such a custom package do NOT need it.
 */
import configureRsbuild, {readCliEnv} from '@xh/hoist-dev-utils/configureRsbuild';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url),
    // Single source of truth for the app version - keep in sync with `xhAppVersion` in
    // gradle.properties. Release builds override this via `XH_APP_VERSION`.
    pkg = require('./package.json'),
    customPkgPath = path.resolve('node_modules/@xh/package-template'),
    // @xh/hoist-chat-kit is a `link:` dependency on the sibling `../../hoist-chat-kit` checkout -
    // see the "Chat kit" section of src/examples/weatherv2/README.md.
    chatKitPath = fs.realpathSync(path.resolve('node_modules/@xh/hoist-chat-kit'));

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
        extraIncludePaths: [customPkgPath, chatKitPath],
        // Skip the chat kit's own dev dependencies - the aliases below keep the build out of them.
        extraExcludePaths: [path.resolve(chatKitPath, 'node_modules')],
        resolveAliases: chatKitAliases(),
        // `rsbuild build --env-mode prod` / `rsbuild dev --env-mode inlineHoist`
        prodBuild: envMode === 'prod',
        inlineHoist: envMode === 'inlineHoist',
        ...readCliEnv()
    });
};

/**
 * Point the chat kit's imports at this app's copies of the libraries it shares with Hoist.
 *
 * The linked kit resolves to its real path, so its imports would otherwise resolve from the kit's
 * own `node_modules` - a second `@xh/hoist` (two `XH` singletons) and React. MobX comes through
 * Hoist, so the kit must import it from `@xh/hoist/mobx`. In inline Hoist mode, configureRsbuild
 * replaces the `@xh/hoist`, `react` and `react-dom` aliases with its own.
 */
function chatKitAliases() {
    const appPkg = name => fs.realpathSync(path.resolve('node_modules', name));
    return {
        '@xh/hoist': appPkg('@xh/hoist'),
        react: appPkg('react'),
        'react-dom': appPkg('react-dom'),
        lodash: appPkg('lodash')
    };
}
