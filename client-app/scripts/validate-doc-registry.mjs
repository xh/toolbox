#!/usr/bin/env node
/**
 * Validates that the hoist-react documentation files in the installed @xh/hoist
 * package have corresponding entries in the server-side DocRegistry.
 *
 * The doc registry has moved server-side (DocsService/DocRegistry.groovy).
 * This script performs a lighter-weight check: it scans the installed @xh/hoist
 * package for doc-worthy markdown files and compares against the known set of
 * hoist-react source paths hardcoded in docRegistry.ts's link resolution map.
 *
 * Usage:
 *   node scripts/validate-doc-registry.mjs
 *
 * Exit codes:
 *   0 = all good
 *   1 = mismatches found
 */
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT_APP = resolve(__dirname, '..');
const HOIST_ROOT = resolve(CLIENT_APP, 'node_modules/@xh/hoist');
const REGISTRY_FILE = resolve(
    CLIENT_APP,
    'src/desktop/tabs/docs/docRegistry.ts'
);

// Files in @xh/hoist that are intentionally NOT included in the doc registry.
const IGNORED_FILES = new Set([
    'docs/archive/CHANGELOG-pre-v56.md',
    'docs/archive/upgrade-to-typescript.md',
    'docs/planning/docs-roadmap.md',
    'docs/planning/docs-roadmap-log.md',
    'public/README.md',
    'static/README.md',
    'CHANGELOG.md',
    'LICENSE.md'
]);

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/** Extract all source paths from the HOIST_REACT_SOURCE_PATHS map in docRegistry.ts. */
function parseRegistryPaths() {
    const src = readFileSync(REGISTRY_FILE, 'utf-8');
    const paths = [];
    // Match entries like: 'docs/authentication.md': 'authentication',
    for (const match of src.matchAll(/'([^']+\.md)':\s*'[^']+'/g)) {
        paths.push(match[1]);
    }
    return new Set(paths);
}

// Find all README.md and docs/*.md files in the installed hoist package.
function findHoistDocFiles() {
    const results = new Set();

    const readmes = findFiles(HOIST_ROOT, 'README.md');
    for (const f of readmes) results.add(f);

    const docs = findFiles(join(HOIST_ROOT, 'docs'), '.md');
    for (const f of docs) results.add('docs/' + f);

    return results;
}

// Simple recursive file finder.
function findFiles(dir, suffix, prefix = '') {
    const results = [];
    if (!existsSync(dir)) return results;

    for (const entry of readdirSync(dir, {withFileTypes: true})) {
        const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.name === 'node_modules') continue;
        if (entry.isDirectory()) {
            results.push(...findFiles(join(dir, entry.name), suffix, relPath));
        } else if (entry.name.endsWith(suffix)) {
            results.push(relPath);
        }
    }
    return results;
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------
function main() {
    if (!existsSync(HOIST_ROOT)) {
        console.error(
            '❌ @xh/hoist not found in node_modules. Run yarn install first.'
        );
        process.exit(1);
    }

    const registryPaths = parseRegistryPaths();
    const hoistFiles = findHoistDocFiles();

    let ok = true;

    // Files in hoist but missing from registry
    const missing = [...hoistFiles]
        .filter(f => !registryPaths.has(f) && !IGNORED_FILES.has(f))
        .sort();

    if (missing.length > 0) {
        ok = false;
        console.log('\n⚠️  Files in @xh/hoist not in doc registry:\n');
        for (const f of missing) console.log(`   + ${f}`);
    }

    // Registry entries pointing to files that don't exist
    const stale = [...registryPaths]
        .filter(p => !hoistFiles.has(p))
        .sort();

    if (stale.length > 0) {
        ok = false;
        console.log('\n⚠️  Registry entries with no matching file in @xh/hoist:\n');
        for (const f of stale) console.log(`   - ${f}`);
    }

    // Summary
    const hoistVersion = getHoistVersion();
    console.log(
        `\nDoc registry: ${registryPaths.size} entries, ` +
        `@xh/hoist has ${hoistFiles.size} doc files ` +
        `(${IGNORED_FILES.size} ignored)` +
        (hoistVersion ? `, version ${hoistVersion}` : '')
    );

    if (ok) {
        console.log('✅ Doc registry is in sync.\n');
    } else {
        console.log(
            '\n🔧 Update HOIST_REACT_SOURCE_PATHS in docRegistry.ts or the server-side DocRegistry.groovy.\n'
        );
        process.exit(1);
    }
}

function getHoistVersion() {
    try {
        const pkg = JSON.parse(
            readFileSync(join(HOIST_ROOT, 'package.json'), 'utf-8')
        );
        return pkg.version;
    } catch {
        return null;
    }
}

main();
