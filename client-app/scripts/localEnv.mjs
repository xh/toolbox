/**
 * Reads the per-developer switches that point Toolbox at local library checkouts. Each is a
 * variable in the environment or in a gitignored `client-app/.env.local`. The environment wins, as
 * it does when Rsbuild loads the same file.
 */
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseEnv} from 'node:util';

export const CLIENT_APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @param {string} name - the variable to read.
 * @returns {?string} - its value, or null when it is unset or empty.
 */
export function readLocalVar(name) {
    return (process.env[name] ?? readEnvLocal()[name]) || null;
}

export function readJson(file) {
    return JSON.parse(readFileSync(file, 'utf8'));
}

//------------------
// Implementation
//------------------
function readEnvLocal() {
    const file = join(CLIENT_APP, '.env.local');
    return existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {};
}
