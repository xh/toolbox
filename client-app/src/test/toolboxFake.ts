import type {FakeHoistCore, PrefEntry} from '@xh/hoist/test-support';

/**
 * Seed the fake hoist-core with Toolbox's own server state, so a spec boots against what the
 * Toolbox server gives a client. Called once per spec file from `src/test/setup.ts`, before boot.
 *
 * Configs and prefs mirror the client-visible specs in `grails-app/init/io/xh/toolbox/BootStrap.groovy`,
 * at their server defaults. Update this file in the same change as BootStrap.
 */
export function installToolboxFake(core: FakeHoistCore) {
    Object.assign(core.configs, {
        jsLicenses: {agGrid: null},
        sourceUrls: {
            hoistReact: 'https://github.com/xh/hoist-react/tree/develop',
            toolbox: 'https://github.com/xh/toolbox/tree/develop'
        },
        cubeTestDefaultDims: [
            ['fund', 'trader'],
            ['sector', 'symbol'],
            ['trader', 'dir', 'symbol'],
            ['model', 'sector', 'symbol'],
            ['model', 'region', 'trader', 'symbol']
        ]
    });

    Object.assign(core.prefs, {
        appMenuButtonWithUserProfile: pref('bool', false),
        font: pref('string', 'IBM Plex Sans'),
        contactAppState: pref('json', {}),
        // The server default is four setup tasks due today. Specs seed their own tasks.
        todoTasks: pref('json', []),
        cubeTestUserDims: pref('json', {}),
        mobileHomeWidgets: pref('json', {})
    });
}

/** A pref at its default value, as hoist-core renders one the user has not set. */
export function pref(type: PrefEntry['type'], defaultValue: any): PrefEntry {
    return {type, value: structuredClone(defaultValue), defaultValue, isSet: false};
}
