#!/usr/bin/env node
/**
 * Writes the hoist-react and hoist-core docs the docs viewers read, into `public/hoist-docs/`
 * (served at `/public/hoist-docs/`), using `hoist-docs export-docs` from @xh/hoist-docs.
 *
 * Source, as Toolbox's docs have always been read:
 *   1. Sibling checkouts (`../../hoist-react`, `../../hoist-core`), when present: docs are read
 *      straight from them, so doc edits can be previewed before they are committed. With
 *      `--watch`, the docs are rewritten on every change - reload the viewer to see them.
 *   2. Otherwise, the docs of the Hoist builds Toolbox runs: the index inside its installed
 *      @xh/hoist, and hoist-core's `docs-index` Maven artifact for `hoistCoreVersion`.
 *
 * Never fails the build or dev server: if docs cannot be written, it warns, and the viewers show
 * that docs are unavailable.
 *
 * Usage: node scripts/export-docs.mjs [--watch]
 */
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const clientApp = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
    out = resolve(clientApp, 'public/hoist-docs'),
    siblings = ['../../hoist-react', '../../hoist-core']
        .map(p => resolve(clientApp, p))
        .filter(dir => existsSync(resolve(dir, 'docs/doc-registry.json'))),
    watch = process.argv.includes('--watch');

const args = ['export-docs', '--out', out];
if (siblings.length) {
    siblings.forEach(dir => args.push('--from-checkout', dir));
    if (watch) args.push('--watch');
    console.log(
        `Exporting docs from ${siblings.join(', ')}${watch ? ', watching for changes' : ''}`
    );
} else {
    args.push('--project', resolve(clientApp, '..'));
    console.log('Exporting published docs for the Hoist versions Toolbox runs');
}

// The package's own launcher, not `.bin/hoist-docs`: releases of @xh/hoist ship an older CLI of
// the same name, which can take that slot.
const bin = resolve(clientApp, 'node_modules/@xh/hoist-docs/bin/hoist-docs.mjs'),
    res = spawnSync(process.execPath, [bin, ...args], {stdio: 'inherit'});
if (res.status !== 0) {
    console.warn(
        'WARNING: Hoist docs were not exported - the docs viewers will show them as unavailable.'
    );
}
