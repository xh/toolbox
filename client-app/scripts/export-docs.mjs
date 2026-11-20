#!/usr/bin/env node
/**
 * Writes the hoist-react, hoist-core and hoist-chat-kit docs the docs viewers read, into
 * `public/hoist-docs/` (served at `/public/hoist-docs/`), using `hoist-docs export-docs` from
 * @xh/hoist-docs.
 *
 * Source, per library:
 *   1. A sibling checkout (`../../hoist-react`, `../../hoist-core`, `../../hoist-chat-kit`), when
 *      present: docs are read straight from it, so doc edits can be previewed before they are
 *      committed. With `--watch`, the docs are rewritten on every change - reload the viewer to
 *      see them.
 *   2. Otherwise, the docs of the build Toolbox runs: the index inside its installed @xh/hoist and
 *      @xh/hoist-chat-kit, and hoist-core's `docs-index` Maven artifact for `hoistCoreVersion`.
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
    siblings = ['../../hoist-react', '../../hoist-core', '../../hoist-chat-kit']
        .map(p => resolve(clientApp, p))
        .filter(dir => existsSync(resolve(dir, 'docs/doc-registry.json'))),
    watch = process.argv.includes('--watch');

// Libraries without a checkout come from the project's installed builds.
const args = ['export-docs', '--out', out, '--project', resolve(clientApp, '..')];
if (siblings.length) {
    siblings.forEach(dir => args.push('--from-checkout', dir));
    if (watch) args.push('--watch');
    console.log(
        `Exporting docs from ${siblings.join(', ')}, and the installed builds of any other library${watch ? ', watching for changes' : ''}`
    );
} else {
    console.log('Exporting the docs of the Hoist builds Toolbox runs');
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
