import {defineConfig, devices} from '@playwright/test';
import {config} from 'dotenv';
import {resolve} from 'path';

// Load the project-root .env file — same env vars the Grails backend reads.
config({path: resolve(__dirname, '../.env')});

if (process.env.APP_TOOLBOX_OAUTH_PROVIDER !== 'NONE') {
    throw new Error(
        'APP_TOOLBOX_OAUTH_PROVIDER must be set to "NONE" in .env before running Playwright tests. ' +
            'The suite uses the Hoist password login form and the bootstrapped test users; OAuth would ' +
            'redirect to an interactive provider that cannot be driven from these specs.'
    );
}

if (!process.env.APP_TOOLBOX_TEST_USER_PASSWORD) {
    throw new Error(
        'APP_TOOLBOX_TEST_USER_PASSWORD must be set in .env. The backend bootstraps test users ' +
            '(test-admin@xh.io, test-user@xh.io) with this password when running in local dev.'
    );
}

// NOTE: Unlike JobSite (which guards against accidental Harvest mutations), Toolbox has no
// destructive external API to gate on. If a future test exercises mutating GitHub / Slack / etc.
// flows, add a corresponding read-only assertion here before running the suite.

export default defineConfig({
    testDir: './tests',
    // Per-test BrowserContext + role-scoped storageState mean specs do not share state, so
    // parallel execution is safe by default. JobSite's original config used `fullyParallel: false`
    // because of Harvest write-protection concerns; Toolbox has no equivalent.
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI
        ? [['junit', {outputFile: 'results.xml'}], ['github']]
        : [['list'], ['html', {open: 'never'}]],
    use: {
        baseURL: 'http://localhost:3000/app',
        // Always retain a trace on the first failure so devs and CI both get a debuggable artifact.
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },
    timeout: 5 * 60 * 1000,
    globalTimeout: 1 * 60 * 60 * 1000,
    expect: {
        // Tighten default Locator timeout while leaving room for first-mount waits explicitly.
        timeout: 10 * 1000
    },

    // Verify required servers are running before launching tests. Toolbox specs need both the
    // Grails backend (:8080) and the webpack dev server (:3000) — devs run them in separate
    // terminals (`./gradlew bootRun` + `cd client-app && yarn start`). globalSetup pings both
    // and fails fast with a useful message if either is missing.
    globalSetup: require.resolve('./globalSetup'),

    projects: [
        {
            name: 'setup',
            use: {...devices['Desktop Chrome']},
            testMatch: /.*\.setup\.ts/
        },
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
            dependencies: ['setup']
        }
    ]
});
