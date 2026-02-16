/**
 * Creates a symlink at `docs/hoist-react/` (project root) pointing to the hoist-react
 * documentation shipped within `node_modules/@xh/hoist/docs/`. This makes the docs
 * accessible outside of `node_modules`, which is important for AI coding agents that
 * may otherwise overlook or deprioritize paths within that directory.
 *
 * Both CLAUDE.md and AGENTS.md direct AI agents to consult `docs/hoist-react/README.md`
 * as their first step before writing client-side code. This symlink ensures that path exists.
 *
 * Run automatically via the `postinstall` script in package.json.
 * Uses 'junction' type for Windows compatibility without requiring admin privileges.
 * The resulting symlink is gitignored.
 */
const fs = require('fs');
const path = require('path');

const docsDir = path.resolve(__dirname, '..', '..', 'docs');
const link = path.join(docsDir, 'hoist-react');
const target = path.resolve(__dirname, '..', 'node_modules', '@xh', 'hoist', 'docs');

if (!fs.existsSync(target)) {
    console.log('[link-hoist-docs] @xh/hoist not installed yet — skipping docs symlink.');
    process.exit(0);
}

fs.mkdirSync(docsDir, {recursive: true});
try {
    fs.rmSync(link, {force: true, recursive: true});
} catch (e) {
    // Ignore error if it is of the "file doesn't exist" type
    if (e.code !== 'ENOENT') throw e;
}
fs.symlinkSync(target, link, 'junction');
console.log('[link-hoist-docs] Linked docs/hoist-react -> @xh/hoist/docs');
