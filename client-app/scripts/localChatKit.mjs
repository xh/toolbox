/**
 * Runs Toolbox against a local checkout of `@xh/hoist-chat-kit`, in place of the installed
 * package. The dev server, the unit tests and the type-check all read the same switch: the
 * `XH_CHAT_KIT_PATH` variable, from the environment or from a gitignored `client-app/.env.local`.
 * Unset, which is the default, each uses the installed kit. Production builds never read it.
 *
 * The kit ships as TypeScript and SCSS source, so the app compiles the checkout as it compiles
 * the installed package. See "Running against a local Hoist Chat Kit checkout" in
 * docs/running-locally.md.
 */
import {existsSync, realpathSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {CLIENT_APP, readJson, readLocalVar} from './localEnv.mjs';

const KIT_NAME = '@xh/hoist-chat-kit';

/**
 * The local kit checkout to run against, or null to use the installed package.
 * @param {Object} [opts]
 * @param {boolean} [opts.log=false] - true to log the checkout's path when the switch is on.
 * @returns {?{path: string, aliases: Object<string, string>, nodeModulesPath: string}} - the
 *      checkout's real path, the module aliases that point the app at it, and its own
 *      node_modules, which the app must not compile.
 */
export function localChatKit({log = false} = {}) {
    const raw = readLocalVar('XH_CHAT_KIT_PATH');
    if (!raw) return null;

    const kitPath = resolve(CLIENT_APP, raw),
        pkgPath = join(kitPath, 'package.json');
    if (!existsSync(pkgPath) || readJson(pkgPath).name !== KIT_NAME) {
        throw new Error(`XH_CHAT_KIT_PATH is not a checkout of ${KIT_NAME}: ${kitPath}`);
    }

    const realPath = realpathSync(kitPath);
    if (log) console.log(`  > ${KIT_NAME} LOCAL at ${realPath}`);
    return {
        path: realPath,
        aliases: {[KIT_NAME]: realPath, ...sharedPackageAliases(pkgPath)},
        nodeModulesPath: join(realPath, 'node_modules')
    };
}

//------------------
// Implementation
//------------------
/**
 * Aliases to the app's copy of each package that the kit and the app both declare. A file in the
 * checkout would otherwise resolve its imports from the checkout's own node_modules. A second
 * `@xh/hoist` or `react` there breaks Hoist at runtime. For the rest, the app's copy is what the
 * installed kit would get.
 */
function sharedPackageAliases(kitPkgPath) {
    const {dependencies, peerDependencies} = readJson(kitPkgPath),
        names = Object.keys({...dependencies, ...peerDependencies}),
        ret = {};
    names.forEach(name => {
        const appCopy = join(CLIENT_APP, 'node_modules', name);
        if (existsSync(appCopy)) ret[name] = appCopy;
    });
    return ret;
}
