import {DocService} from '../svc/DocService';
import {DocEntry, DocSection} from './types';

// --- Source repo tokens (matching `$HR`/`$HC` url prefixes) -> doc viewer source names. ---
const DOC_SOURCE_TOKENS: Record<string, string> = {
    $HR: 'hoist-react',
    $HC: 'hoist-core'
};

/**
 * Parse a Markdown doc url (e.g. `$HR/cmp/grid/README.md#tree-grids`) into the params needed to
 * route into the document viewer: the `source` repo, the `docId` (file path, with `/` encoded as
 * `~` for the route), and an optional `section` (an H2 slug). Returns null for any url that is not
 * a repo-relative `.md` doc, so source-code and external links fall through to external handling.
 */
export function docRouteParams(
    url: string
): {source: string; docId: string; section: string} | null {
    const [token, ...rest] = url.split('/');
    const source = DOC_SOURCE_TOKENS[token];
    if (!source || rest.length === 0) return null;

    const [path, section] = rest.join('/').split('#');
    if (!path.endsWith('.md')) return null;

    return {source, docId: path.replaceAll('/', '~'), section: section ?? null};
}

/**
 * Resolve a relative link from one doc to another. Given the current doc entry and a relative href
 * (e.g. '../core/README.md'), returns the matching DocEntry, or undefined if not found.
 *
 * Since entry IDs are file paths, we resolve the relative href against the current doc's directory
 * and look up the result directly in the registry.
 */
export function resolveDocLink(currentDoc: DocEntry, href: string): DocEntry | undefined {
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
        return undefined;
    }

    const cleanHref = href.split('#')[0];
    if (!cleanHref) return undefined;

    const docService = DocService.instance;

    // Resolve the relative path from the current doc's directory.
    const currentDir = currentDoc.id.substring(0, currentDoc.id.lastIndexOf('/') + 1);
    const resolved = normalizePath(currentDir + cleanHref);

    // Check within same source first.
    const sameSourceDoc = docService.registry.find(
        e => e.source === currentDoc.source && e.id === resolved
    );
    if (sameSourceDoc) return sameSourceDoc;

    // Check for cross-source links (e.g. ../../hoist-core/docs/authentication.md).
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

/** Parse H2 headings from raw markdown content into navigable sections. */
export function extractSections(content: string): DocSection[] {
    const regex = /^## (.+)$/gm;
    const sections: DocSection[] = [],
        slugCounts = new Map<string, number>();
    let match: RegExpExecArray;
    while ((match = regex.exec(content)) !== null) {
        const title = stripInlineMarkdown(match[1].trim());
        let id = slugify(title);
        const count = slugCounts.get(id) || 0;
        if (count > 0) id += `-${count}`;
        slugCounts.set(id, count + 1);
        sections.push({id, title});
    }
    return sections;
}

/** Remove inline markdown formatting (code, bold, italic, links) to get plain text. */
export function stripInlineMarkdown(text: string): string {
    return text
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\*\*([^*]*)\*\*/g, '$1')
        .replace(/\*([^*]*)\*/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .trim();
}

/** Convert text to a URL-safe slug: lowercase, strip special chars, hyphenate spaces. */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
