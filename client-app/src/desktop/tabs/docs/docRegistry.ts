/**
 * Types and utilities for the multi-source documentation viewer.
 *
 * The registry itself is loaded from the server (DocsService) at runtime.
 * This file retains the type definitions and utility functions used by
 * DocsPanelModel and DocsTab.
 */
import {DocService} from '../../../core/svc/DocService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DocEntry {
    /** Unique identifier AND relative file path (e.g. 'docs/base-classes.md'). */
    id: string;
    source: string;
    title: string;
    category: string;
    description: string;
    keywords: string[];
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
 * Resolve a relative link from one doc to another.
 * Given the current doc entry and a relative href (e.g., '../core/README.md'),
 * returns the matching DocEntry, or undefined if not found.
 *
 * Since entry IDs are now file paths, we resolve the relative href against
 * the current doc's directory and look up the result directly in the registry.
 */
export function resolveDocLink(currentDoc: DocEntry, href: string): DocEntry | undefined {
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
        return undefined;
    }

    const cleanHref = href.split('#')[0];
    if (!cleanHref) return undefined;

    const docService = DocService.instance;

    // Resolve the relative path from the current doc's directory
    const currentDir = currentDoc.id.substring(0, currentDoc.id.lastIndexOf('/') + 1);
    const resolved = normalizePath(currentDir + cleanHref);

    // Check within same source first
    const sameSourceDoc = docService.registry.find(
        e => e.source === currentDoc.source && e.id === resolved
    );
    if (sameSourceDoc) return sameSourceDoc;

    // Check for cross-source links (e.g. ../../hoist-core/docs/authentication.md)
    if (currentDoc.source === 'hoist-react') {
        const coreMatch = resolved.match(/^(?:\.\.\/)*hoist-core\/(.+)$/);
        if (coreMatch) {
            return docService.registry.find(
                e => e.source === 'hoist-core' && e.id === coreMatch[1]
            );
        }
    }

    if (currentDoc.source === 'hoist-core') {
        const reactMatch = cleanHref.match(/^(?:\.\.\/)*hoist-react\/(.+)$/);
        if (reactMatch) {
            return docService.registry.find(
                e => e.source === 'hoist-react' && e.id === reactMatch[1]
            );
        }
    }

    return undefined;
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
 * Maps doc IDs (file paths) to relevant Toolbox example tabs. Only docs with
 * highly relevant, directly demonstrative examples are included.
 */
const DOC_EXAMPLES: Record<string, DocExampleLink[]> = {
    'cmp/grid/README.md': [
        {title: 'Standard Grid', route: `${R}.grids.standard`},
        {title: 'Tree Grid', route: `${R}.grids.tree`},
        {title: 'Column Filtering', route: `${R}.grids.columnFiltering`},
        {title: 'Inline Editing', route: `${R}.grids.inlineEditing`},
        {title: 'Zone Grid', route: `${R}.grids.zoneGrid`},
        {title: 'DataView', route: `${R}.grids.dataview`},
        {title: 'REST Editor', route: `${R}.grids.rest`}
    ],
    'cmp/form/README.md': [
        {title: 'FormModel', route: `${R}.forms.form`},
        {title: 'Hoist Inputs', route: `${R}.forms.inputs`}
    ],
    'cmp/input/README.md': [
        {title: 'Hoist Inputs', route: `${R}.forms.inputs`},
        {title: 'Select', route: `${R}.forms.select`},
        {title: 'Picker', route: `${R}.forms.picker`}
    ],
    'cmp/layout/README.md': [
        {title: 'HBox', route: `${R}.layout.hbox`},
        {title: 'VBox', route: `${R}.layout.vbox`}
    ],
    'cmp/tab/README.md': [{title: 'TabContainer', route: `${R}.layout.tabPanel`}],
    'desktop/cmp/panel/README.md': [
        {title: 'Panel Intro', route: `${R}.panels.intro`},
        {title: 'Toolbars', route: `${R}.panels.toolbars`},
        {title: 'Panel Sizing', route: `${R}.panels.sizing`},
        {title: 'Mask', route: `${R}.panels.mask`},
        {title: 'Loading Indicator', route: `${R}.panels.loadingIndicator`}
    ],
    'desktop/cmp/dash/README.md': [
        {title: 'DashContainer', route: `${R}.layout.dashContainer`},
        {title: 'DashCanvas', route: `${R}.layout.dashCanvas`}
    ],
    'desktop/README.md': [
        {title: 'Hoist Inputs', route: `${R}.forms.inputs`},
        {title: 'Select', route: `${R}.forms.select`},
        {title: 'LeftRightChooser', route: `${R}.other.leftRightChooser`}
    ],
    'format/README.md': [
        {title: 'Date Formats', route: `${R}.other.formatDates`},
        {title: 'Number Formats', route: `${R}.other.formatNumbers`}
    ],
    'icon/README.md': [{title: 'Icons', route: `${R}.other.icons`}],
    'docs/error-handling.md': [
        {title: 'Exception Handling', route: `${R}.other.exceptionHandler`},
        {title: 'ErrorMessage', route: `${R}.other.errorMessage`}
    ],
    'docs/routing.md': [{title: 'Simple Routing', route: `${R}.other.simpleRouting`}],
    'appcontainer/README.md': [
        {title: 'App Notifications', route: `${R}.other.appNotifications`},
        {title: 'Popups', route: `${R}.other.popups`}
    ],
    'inspector/README.md': [{title: 'Inspector', route: `${R}.other.inspector`}],
    'cmp/README.md': [
        {title: 'Standard Grid', route: `${R}.grids.standard`},
        {title: 'FormModel', route: `${R}.forms.form`},
        {title: 'DataView', route: `${R}.grids.dataview`}
    ],
    'data/README.md': [
        {title: 'Standard Grid', route: `${R}.grids.standard`},
        {title: 'Tree Grid', route: `${R}.grids.tree`}
    ],
    'cmp/viewmanager/README.md': [{title: 'Standard Grid', route: `${R}.grids.standard`}],
    'core/README.md': [{title: 'Factories vs. JSX', route: `${R}.other.jsx`}],
    'mobile/README.md': [{title: 'Mobile', route: `${R}.mobile`}]
};

/** Get example links for a given doc, or an empty array if none. */
export function getDocExamples(docId: string): DocExampleLink[] {
    return DOC_EXAMPLES[docId] ?? [];
}
