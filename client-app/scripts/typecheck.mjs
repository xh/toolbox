#!/usr/bin/env node
/**
 * Type-checks the client with `tsc --noEmit`. Run as `pnpm typecheck`.
 *
 * By default this checks against the installed packages, as CI and the release build do. With
 * `XH_CHAT_KIT_PATH` set, it checks against that local checkout of `@xh/hoist-chat-kit` - see
 * localChatKit.mjs. A tsconfig cannot read a variable, so the script writes a config that extends
 * tsconfig.json and adds `paths` for the checkout, then runs `tsc` on it.
 *
 * A check against a local checkout can pass on code that the published kit does not support yet.
 * Run `XH_CHAT_KIT_PATH= pnpm typecheck` for the check that CI runs.
 */
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {localChatKit} from './localChatKit.mjs';

const CLIENT_APP = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
    chatKit = localChatKit({log: true}),
    args = ['--noEmit'];

if (chatKit) args.push('-p', writeLocalChatKitConfig());

const {status} = spawnSync(join(CLIENT_APP, 'node_modules/.bin/tsc'), args, {
    cwd: CLIENT_APP,
    stdio: 'inherit'
});
process.exit(status ?? 1);

//------------------
// Implementation
//------------------
/**
 * Writes the tsconfig for a check against the local kit, and returns its path. Each alias of the
 * build becomes a `paths` entry, so the checkout's own imports of `@xh/hoist`, `react` and other
 * shared packages resolve to the app's copies, and their types stay one set.
 */
function writeLocalChatKitConfig() {
    const paths = {};
    Object.entries(chatKit.aliases).forEach(([name, target]) => {
        // A package with types from DefinitelyTyped resolves there first. Its own folder holds
        // untyped JS, which `tsc` would take as `any`.
        const targets = [join(CLIENT_APP, 'node_modules/@types', name), target].filter(existsSync);
        paths[name] = targets;
        paths[`${name}/*`] = targets.map(it => `${it}/*`);
    });

    const file = join(CLIENT_APP, 'node_modules/.cache/toolbox/tsconfig.localChatKit.json'),
        config = {
            extends: join(CLIENT_APP, 'tsconfig.json'),
            compilerOptions: {paths},
            // `extends` does not inherit references, and resolves `include` from this file.
            references: [{path: join(CLIENT_APP, 'node_modules/@xh/hoist')}],
            include: [join(CLIENT_APP, 'src')]
        };
    mkdirSync(dirname(file), {recursive: true});
    writeFileSync(file, JSON.stringify(config, null, 2));
    return file;
}
