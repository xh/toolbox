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
 */
import configureVitest from '@xh/hoist-dev-utils/configureVitest';
import {createRequire} from 'node:module';
import path from 'node:path';
import {defineConfig} from 'vitest/config';

const require = createRequire(import.meta.url),
    pkg = require('./package.json');

export default defineConfig(
    configureVitest({
        appCode: 'toolbox',
        appName: 'Toolbox',
        appVersion: pkg.version,
        // Compile the custom package as the build does - see rsbuild.config.mjs.
        extraIncludePaths: [path.resolve('node_modules/@xh/package-template')],
        setupFiles: ['./src/test-support/setup.ts']
    })
);
