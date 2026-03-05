/**
 * Types and utilities for the multi-source documentation viewer.
 *
 * The registry itself is now loaded from the server (DocsService) at runtime.
 * This file retains the type definitions and utility functions used by
 * DocsPanelModel and DocsTab.
 */
import {DocService} from '../../../core/svc/DocService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DocEntry {
    id: string;
    source: string;
    title: string;
    category: string;
    description: string;
    keyTopics: string[];
}

export interface DocCategory {
    id: string;
    title: string;
}

export interface DocSourceInfo {
    label: string;
    categories: DocCategory[];
    mode: string;
}

export interface DocExampleLink {
    title: string;
    /** Full Router5 route name, e.g. 'default.grids.standard'. */
    route: string;
}

// ---------------------------------------------------------------------------
// Link resolution
// ---------------------------------------------------------------------------
/**
 * Source-path map for resolving inter-doc links.
 * Built from the server registry — maps filePath-like keys to DocEntry objects.
 * Since we no longer have sourcePath on entries, we use a convention-based approach:
 * the link resolution matches relative paths against known doc file patterns.
 */

/** Map of known hoist-react source paths to their doc IDs. */
const HOIST_REACT_SOURCE_PATHS: Record<string, string> = {
    'README.md': 'hoist-react',
    'docs/README.md': 'docs-index',
    'docs/coding-conventions.md': 'coding-conventions',
    'core/README.md': 'core',
    'data/README.md': 'data',
    'svc/README.md': 'svc',
    'cmp/README.md': 'cmp',
    'cmp/grid/README.md': 'grid',
    'cmp/form/README.md': 'form',
    'cmp/input/README.md': 'input',
    'cmp/layout/README.md': 'layout',
    'cmp/tab/README.md': 'tab',
    'cmp/viewmanager/README.md': 'viewmanager',
    'desktop/README.md': 'desktop',
    'desktop/cmp/panel/README.md': 'panel',
    'desktop/cmp/dash/README.md': 'dash',
    'mobile/README.md': 'mobile',
    'format/README.md': 'format',
    'appcontainer/README.md': 'appcontainer',
    'utils/README.md': 'utils',
    'promise/README.md': 'promise',
    'mobx/README.md': 'mobx',
    'icon/README.md': 'icon',
    'security/README.md': 'security',
    'kit/README.md': 'kit',
    'inspector/README.md': 'inspector',
    'mcp/README.md': 'mcp',
    'docs/lifecycle-app.md': 'lifecycle-app',
    'docs/lifecycle-models-and-services.md': 'lifecycle-models',
    'docs/authentication.md': 'authentication',
    'docs/persistence.md': 'persistence',
    'docs/authorization.md': 'authorization',
    'docs/routing.md': 'routing',
    'docs/error-handling.md': 'error-handling',
    'docs/test-automation.md': 'test-automation',
    'docs/build-and-publish.md': 'build-publish',
    'docs/build-app-deployment.md': 'build-app-deployment',
    'docs/development-environment.md': 'dev-environment',
    'docs/compilation-notes.md': 'compilation-notes',
    'docs/changelog-format.md': 'changelog-format',
    'docs/version-compatibility.md': 'version-compatibility',
    'docs/upgrade-notes/v82-upgrade-notes.md': 'v82-upgrade',
    'docs/upgrade-notes/v81-upgrade-notes.md': 'v81-upgrade',
    'docs/upgrade-notes/v80-upgrade-notes.md': 'v80-upgrade',
    'docs/upgrade-notes/v79-upgrade-notes.md': 'v79-upgrade',
    'docs/upgrade-notes/v78-upgrade-notes.md': 'v78-upgrade'
};

// Reverse map: docId -> sourcePath (for the active doc's context)
const DOC_ID_TO_SOURCE_PATH: Record<string, string> = {};
for (const [path, id] of Object.entries(HOIST_REACT_SOURCE_PATHS)) {
    DOC_ID_TO_SOURCE_PATH[id] = path;
}

/**
 * Resolve a relative link from one doc to another.
 * Given the current doc entry and a relative href (e.g., '../core/README.md'),
 * returns the matching DocEntry, or undefined if not found.
 */
export function resolveDocLink(currentDoc: DocEntry, href: string): DocEntry | undefined {
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
        return undefined;
    }

    const cleanHref = href.split('#')[0];
    if (!cleanHref) return undefined;

    const docService = DocService.instance;

    // For hoist-react docs, resolve using known source paths
    if (currentDoc.source === 'hoist-react') {
        const currentSourcePath = DOC_ID_TO_SOURCE_PATH[currentDoc.id];
        if (currentSourcePath) {
            const currentDir = currentSourcePath.substring(
                0,
                currentSourcePath.lastIndexOf('/') + 1
            );
            const resolved = normalizePath(currentDir + cleanHref);

            // Check if this resolves to a hoist-react doc
            const reactDocId = HOIST_REACT_SOURCE_PATHS[resolved];
            if (reactDocId) return docService.getDocEntry(reactDocId, 'hoist-react');

            // Check for cross-source links (e.g. ../../hoist-core/docs/authentication.md)
            const coreMatch = resolved.match(/^(?:\.\.\/)*hoist-core\/(.+)$/);
            if (coreMatch) {
                return findCoreDocByPath(coreMatch[1]);
            }
        }
    }

    // For hoist-core docs, resolve relative paths within core
    if (currentDoc.source === 'hoist-core') {
        // Cross-source link to hoist-react
        const reactMatch = cleanHref.match(/^(?:\.\.\/)*hoist-react\/(.+)$/);
        if (reactMatch) {
            const reactDocId = HOIST_REACT_SOURCE_PATHS[reactMatch[1]];
            if (reactDocId) return docService.getDocEntry(reactDocId, 'hoist-react');
        }
    }

    return undefined;
}

/** Find a hoist-core doc entry by its file path. */
function findCoreDocByPath(filePath: string): DocEntry | undefined {
    return DocService.instance.registry.find(
        e => e.source === 'hoist-core' && filePath.endsWith(e.id + '.md')
    );
}

/** Normalize a path by resolving `.` and `..` segments. */
function normalizePath(path: string): string {
    const parts = path.split('/');
    const result: string[] = [];
    for (const part of parts) {
        if (part === '.' || part === '') continue;
        if (part === '..') {
            result.pop();
        } else {
            result.push(part);
        }
    }
    return result.join('/');
}

// ---------------------------------------------------------------------------
// Doc → Toolbox example tab mappings (hoist-react only)
// ---------------------------------------------------------------------------
const R = 'default';

/**
 * Maps doc IDs to relevant Toolbox example tabs. Only docs with highly relevant,
 * directly demonstrative examples are included — not every doc needs entries here.
 */
const DOC_EXAMPLES: Record<string, DocExampleLink[]> = {
    grid: [
        {title: 'Standard Grid', route: `${R}.grids.standard`},
        {title: 'Tree Grid', route: `${R}.grids.tree`},
        {title: 'Column Filtering', route: `${R}.grids.columnFiltering`},
        {title: 'Inline Editing', route: `${R}.grids.inlineEditing`},
        {title: 'Zone Grid', route: `${R}.grids.zoneGrid`},
        {title: 'DataView', route: `${R}.grids.dataview`},
        {title: 'REST Editor', route: `${R}.grids.rest`}
    ],
    form: [
        {title: 'FormModel', route: `${R}.forms.form`},
        {title: 'Hoist Inputs', route: `${R}.forms.inputs`}
    ],
    input: [
        {title: 'Hoist Inputs', route: `${R}.forms.inputs`},
        {title: 'Select', route: `${R}.forms.select`},
        {title: 'Picker', route: `${R}.forms.picker`}
    ],
    layout: [
        {title: 'HBox', route: `${R}.layout.hbox`},
        {title: 'VBox', route: `${R}.layout.vbox`}
    ],
    tab: [{title: 'TabContainer', route: `${R}.layout.tabPanel`}],
    panel: [
        {title: 'Panel Intro', route: `${R}.panels.intro`},
        {title: 'Toolbars', route: `${R}.panels.toolbars`},
        {title: 'Panel Sizing', route: `${R}.panels.sizing`},
        {title: 'Mask', route: `${R}.panels.mask`},
        {title: 'Loading Indicator', route: `${R}.panels.loadingIndicator`}
    ],
    dash: [
        {title: 'DashContainer', route: `${R}.layout.dashContainer`},
        {title: 'DashCanvas', route: `${R}.layout.dashCanvas`}
    ],
    desktop: [
        {title: 'Hoist Inputs', route: `${R}.forms.inputs`},
        {title: 'Select', route: `${R}.forms.select`},
        {title: 'LeftRightChooser', route: `${R}.other.leftRightChooser`}
    ],
    format: [
        {title: 'Date Formats', route: `${R}.other.formatDates`},
        {title: 'Number Formats', route: `${R}.other.formatNumbers`}
    ],
    icon: [{title: 'Icons', route: `${R}.other.icons`}],
    'error-handling': [
        {title: 'Exception Handling', route: `${R}.other.exceptionHandler`},
        {title: 'ErrorMessage', route: `${R}.other.errorMessage`}
    ],
    routing: [{title: 'Simple Routing', route: `${R}.other.simpleRouting`}],
    appcontainer: [
        {title: 'App Notifications', route: `${R}.other.appNotifications`},
        {title: 'Popups', route: `${R}.other.popups`}
    ],
    inspector: [{title: 'Inspector', route: `${R}.other.inspector`}],
    cmp: [
        {title: 'Standard Grid', route: `${R}.grids.standard`},
        {title: 'FormModel', route: `${R}.forms.form`},
        {title: 'DataView', route: `${R}.grids.dataview`}
    ],
    data: [
        {title: 'Standard Grid', route: `${R}.grids.standard`},
        {title: 'Tree Grid', route: `${R}.grids.tree`}
    ],
    viewmanager: [{title: 'Standard Grid', route: `${R}.grids.standard`}],
    core: [{title: 'Factories vs. JSX', route: `${R}.other.jsx`}],
    mobile: [{title: 'Mobile', route: `${R}.mobile`}]
};

/** Get example links for a given doc, or an empty array if none. */
export function getDocExamples(docId: string): DocExampleLink[] {
    return DOC_EXAMPLES[docId] ?? [];
}
