/**
 * Vitest unit test configuration, driven by `configureVitest()` from hoist-dev-utils.
 * Run via `pnpm test` / `pnpm test:watch` (see package.json scripts).
 *
 * The preset compiles specs with the same SWC settings and build constants as `rsbuild.config.mjs`,
 * and loads hoist-react's test kit (`@xh/hoist/test-support`), which runs Hoist's real client
 * services against a fake hoist-core. Specs live beside their source as `*.spec.ts`. See the
 * "Unit Tests in an App" section of hoist-react's `docs/unit-testing.md`.
 *
 * `pnpm testWithHoist` runs the specs against a sibling hoist-react checkout, as `startWithHoist`
 * does for the dev server.
 *
 * With `XH_CHAT_KIT_PATH` set, the specs run against that local checkout of `@xh/hoist-chat-kit`,
 * as the dev server does - see scripts/localChatKit.mjs.
 */
import configureVitest from '@xh/hoist-dev-utils/configureVitest';
import {createRequire} from 'node:module';
import path from 'node:path';
import {defineConfig, mergeConfig} from 'vitest/config';
import {localChatKit} from './scripts/localChatKit.mjs';

const require = createRequire(import.meta.url),
    pkg = require('./package.json'),
    customPkgPath = path.resolve('node_modules/@xh/package-template'),
    chatKit = localChatKit();

const config = configureVitest({
    appCode: 'toolbox',
    appName: 'Toolbox',
    appVersion: pkg.version,
    // Compile the custom package as the build does - see rsbuild.config.mjs.
    extraIncludePaths: chatKit ? [customPkgPath, chatKit.path] : [customPkgPath],
    extraExcludePaths: chatKit ? [chatKit.nodeModulesPath] : [],
    resolveAliases: chatKit?.aliases,
    setupFiles: ['./src/test-support/setup.ts']
});

export default defineConfig(
    chatKit
        ? // Vite serves files outside the root only from allowed dirs. Setting this replaces the
          // default, so the root is listed again.
          mergeConfig(config, {server: {fs: {allow: [config.root, chatKit.path]}}})
        : config
);
