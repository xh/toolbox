#!/usr/bin/env node
/**
 * Validates that the toolbox doc registry (docRegistry.ts) is in sync with the
 * markdown documentation files shipped in the installed @xh/hoist package.
 *
 * Checks:
 *  1. Every sourcePath in the registry points to a real file in @xh/hoist.
 *  2. Every doc-worthy markdown file in @xh/hoist has a registry entry.
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
// Add paths here (relative to hoist root) when a file should be excluded from
// the viewer — e.g. internal planning docs, thin stubs, or archived content.
const IGNORED_FILES = new Set([
    // Archive and internal planning docs — not user-facing.
    'docs/archive/CHANGELOG-pre-v56.md',
    'docs/archive/upgrade-to-typescript.md',
    'docs/planning/docs-roadmap.md',
    'docs/planning/docs-roadmap-log.md',
    // Build infrastructure stubs — not framework documentation.
    'public/README.md',
    'static/README.md',
    // Top-level repo files — not part of the doc viewer.
    'CHANGELOG.md',
    'LICENSE.md'
]);

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/** Extract all sourcePath values from the registry TypeScript source. */
function parseRegistryPaths() {
    const src = readFileSync(REGISTRY_FILE, 'utf-8');
    const paths = [];
    for (const match of src.matchAll(/sourcePath:\s*'([^']+)'/g)) {
        paths.push(match[1]);
    }
    return new Set(paths);
}

/** Glob for all README.md and docs/**\/*.md files in the installed hoist package. */
function findHoistDocFiles() {
    const results = new Set();

    // Find README.md files at package level (not nested in node_modules)
    const readmes = findFiles(HOIST_ROOT, 'README.md');
    for (const f of readmes) results.add(f);

    // Find docs/**/*.md files
    const docs = findFiles(join(HOIST_ROOT, 'docs'), '.md');
    for (const f of docs) results.add('docs/' + f);

    return results;
}

/** Simple recursive file finder — avoids needing glob dependency. */
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

    // Check 1: Files in hoist but missing from registry
    const missing = [...hoistFiles]
        .filter(f => !registryPaths.has(f) && !IGNORED_FILES.has(f))
        .sort();

    if (missing.length > 0) {
        ok = false;
        console.log('\n⚠️  Files in @xh/hoist not in doc registry:\n');
        for (const f of missing) console.log(`   + ${f}`);
    }

    // Check 2: Registry entries pointing to files that don't exist
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
            '\n🔧 Update docRegistry.ts to add missing entries or add paths to IGNORED_FILES.\n'
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
