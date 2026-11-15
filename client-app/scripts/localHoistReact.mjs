/**
 * Type-checks Toolbox against a local checkout of hoist-react (`@xh/hoist`), in place of the
 * installed package. The switch is the `XH_HOIST_REACT_PATH` variable, from the environment or
 * from a gitignored `client-app/.env.local`. Unset, which is the default, the check uses the
 * installed Hoist.
 *
 * This is the variable that inline mode reads to find its checkout. The dev server and the unit
 * tests use it only in inline mode (`pnpm startWithHoist`, `pnpm testWithHoist`). The type-check
 * has no inline mode, so it uses the checkout whenever the variable is set. See "Type-checking
 * against a local hoist-react checkout" in docs/running-locally.md.
 */
import {existsSync, realpathSync} from 'node:fs';
import {isAbsolute, join} from 'node:path';
import {CLIENT_APP, readJson, readLocalVar} from './localEnv.mjs';

const HOIST_NAME = '@xh/hoist',
    // The packages that inline Hoist must share with the app - see INLINE_HOIST_SINGLETONS in
    // hoist-dev-utils. The checkout resolves each to the app's copy, so its types stay one set.
    SHARED_PACKAGES = ['react', 'react-dom', 'ag-grid-react', 'ag-grid-community'];

/**
 * The local hoist-react checkout to type-check against, or null to use the installed package.
 * @param {Object} [opts]
 * @param {boolean} [opts.log=false] - true to log the checkout's path when the switch is on.
 * @returns {?{path: string, aliases: Object<string, string>}} - the checkout's real path, and the
 *      module aliases that point the app at it.
 */
export function localHoistReact({log = false} = {}) {
    const raw = readLocalVar('XH_HOIST_REACT_PATH');
    if (!raw) return null;

    // The inline build takes an absolute path only. Hold the type-check to the same rule.
    if (!isAbsolute(raw)) {
        throw new Error(`XH_HOIST_REACT_PATH must be an absolute path - found "${raw}".`);
    }
    const pkgPath = join(raw, 'package.json');
    if (!existsSync(pkgPath) || readJson(pkgPath).name !== HOIST_NAME) {
        throw new Error(`XH_HOIST_REACT_PATH is not a checkout of hoist-react: ${raw}`);
    }

    const realPath = realpathSync(raw),
        aliases = {[HOIST_NAME]: realPath};
    SHARED_PACKAGES.forEach(name => {
        const appCopy = join(CLIENT_APP, 'node_modules', name);
        if (existsSync(appCopy)) aliases[name] = appCopy;
    });

    if (log) console.log(`  > ${HOIST_NAME} LOCAL at ${realPath}`);
    return {path: realPath, aliases};
}
