#!/usr/bin/env node
/**
 * Type-checks the client with `tsc --noEmit`. Run as `pnpm typecheck`.
 *
 * By default this checks against the installed packages, as CI and the release build do. Two
 * switches point it at a local checkout in place of an installed package:
 *  - `XH_CHAT_KIT_PATH` for `@xh/hoist-chat-kit` - see localChatKit.mjs.
 *  - `XH_HOIST_REACT_PATH` for `@xh/hoist` - see localHoistReact.mjs.
 *
 * A tsconfig cannot read a variable, so with either switch on the script writes a config that
 * extends tsconfig.json and adds `paths` for the checkouts, then runs `tsc` on it.
 *
 * A check against a local checkout can pass on code that the published package does not support
 * yet. Run `XH_CHAT_KIT_PATH= XH_HOIST_REACT_PATH= pnpm typecheck` for the check that CI runs.
 */
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {localChatKit} from './localChatKit.mjs';
import {CLIENT_APP} from './localEnv.mjs';
import {localHoistReact} from './localHoistReact.mjs';

const chatKit = localChatKit({log: true}),
    hoistReact = localHoistReact({log: true}),
    args = ['--noEmit'];

if (chatKit || hoistReact) args.push('-p', writeLocalConfig());

const {status} = spawnSync(join(CLIENT_APP, 'node_modules/.bin/tsc'), args, {
    cwd: CLIENT_APP,
    stdio: 'inherit'
});
process.exit(status ?? 1);

//------------------
// Implementation
//------------------
/**
 * Writes the tsconfig for a check against the local checkouts, and returns its path. Each alias
 * becomes a `paths` entry, so a checkout's own imports of `@xh/hoist`, `react` and other shared
 * packages resolve to the copies the app uses, and their types stay one set. The Hoist aliases
 * come last: with both switches on, the kit resolves `@xh/hoist` to the Hoist checkout.
 */
function writeLocalConfig() {
    const aliases = {...chatKit?.aliases, ...hoistReact?.aliases},
        paths = {};
    Object.entries(aliases).forEach(([name, target]) => {
        // A package with types from DefinitelyTyped resolves there first. Its own folder holds
        // untyped JS, which `tsc` would take as `any`.
        const targets = [join(CLIENT_APP, 'node_modules/@types', name), target].filter(existsSync);
        paths[name] = targets;
        paths[`${name}/*`] = targets.map(it => `${it}/*`);
    });

    const file = join(CLIENT_APP, 'node_modules/.cache/toolbox/tsconfig.local.json'),
        config = {
            extends: join(CLIENT_APP, 'tsconfig.json'),
            compilerOptions: {paths},
            // `extends` does not inherit references, and resolves `include` from this file. The
            // installed Hoist is a referenced project, which `tsc` reads through its published
            // declarations. A Hoist checkout is not: `tsc` would read its `build/types` output,
            // which is absent or stale, so the check compiles the checkout's source instead.
            references: hoistReact ? [] : [{path: join(CLIENT_APP, 'node_modules/@xh/hoist')}],
            include: [join(CLIENT_APP, 'src')]
        };
    mkdirSync(dirname(file), {recursive: true});
    writeFileSync(file, JSON.stringify(config, null, 2));
    return file;
}
