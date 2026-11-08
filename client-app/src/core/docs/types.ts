/** Types for the multi-source documentation viewer (shared desktop + mobile). */

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
    /** Version of the library whose docs are loaded. */
    version: string;
    /** Versions the Hoist Docs service holds, newest first. */
    versions: string[];
}

export interface DocSection {
    id: string;
    title: string;
}

export interface DocExampleLink {
    title: string;
    /** Full Router5 route name, e.g. 'default.grids.standard'. */
    route: string;
}
