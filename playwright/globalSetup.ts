import {request} from '@playwright/test';

/**
 * Pre-flight check run once before any spec. Confirms both the Grails backend (:8080) and the
 * webpack dev server (:3000) are reachable. Throws a clean, actionable error if not — much
 * friendlier than the cryptic connection refused that Playwright surfaces otherwise.
 *
 * NOT a server launcher: devs run `./gradlew bootRun` and `yarn start` themselves in separate
 * terminals (matching the rest of the local dev workflow). Playwright's `webServer` option could
 * launch the frontend, but starting the Grails backend from a Node script is fragile and would
 * dramatically slow first-run; this check + clear error is the deliberate tradeoff.
 */
export default async function globalSetup() {
    const ctx = await request.newContext();
    try {
        await assertReachable(ctx, 'http://localhost:8080/ping', 'Grails backend', 'gradle bootRun');
        await assertReachable(ctx, 'http://localhost:3000/app/', 'Webpack dev server', 'cd client-app && yarn start');
    } finally {
        await ctx.dispose();
    }
}

async function assertReachable(ctx: any, url: string, label: string, startCmd: string) {
    try {
        const resp = await ctx.get(url, {timeout: 5000});
        if (!resp.ok() && resp.status() !== 401) {
            throw new Error(`${label} responded with HTTP ${resp.status()} from ${url}`);
        }
    } catch (e: any) {
        throw new Error(
            `Playwright globalSetup: cannot reach ${label} at ${url}. ` +
                `Start it with: \`${startCmd}\`\n  Underlying error: ${e.message ?? e}`
        );
    }
}
