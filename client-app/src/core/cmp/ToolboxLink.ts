import {a} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistProps, XH} from '@xh/hoist/core';

export interface ToolboxLinkProps extends HoistProps {
    /**
     * URL for the link.
     *
     * Can be a fully qualified URL for external/other links, or start with one of the following
     * tokens to support configurable roots for the Hoist-React and Toolbox Github repos.
     *
     *      `$TB` for toolbox files, e.g. '$TB/client-app/src/desktop/App.js'
     *          - or -
     *      `$HR` for hoist-react files, e.g. '$HR/desktop/cmp/button/Button.js'
     */
    url: string;

    /**
     * Custom text for the link itself. Defaults to the portion of the url following the
     * last slash - typically expected to be the relevant file name.
     */
    text?: string;

    /**
     * Optional `notes` property for additional descriptive text.
     */
    notes?: string;
}

export const [ToolboxLink, toolboxLink] = hoistCmp.withFactory<ToolboxLinkProps>({
    displayName: 'ToolboxLink',

    render({text, url}) {
        // Markdown docs route into Toolbox's own document viewer for a fluid, in-app experience
        // rather than bouncing the user out to GitHub.
        const docRef = docRouteParams(url);
        if (docRef) {
            const params: Record<string, string> = {source: docRef.source, docId: docRef.docId};
            if (docRef.section) params.section = docRef.section;
            return a({
                href: XH.router.buildPath(DOCS_ROUTE, params),
                item: text || createDefaultText(url),
                onClick: e => {
                    e.preventDefault();
                    XH.navigate(DOCS_ROUTE, params);
                }
            });
        }

        return a({
            href: toolboxUrl(url),
            item: text || createDefaultText(url),
            target: '_blank'
        });
    }
});

export function toolboxUrl(url: string) {
    const sourceUrls = XH.getConf('sourceUrls');
    return url.replace('$TB', sourceUrls.toolbox).replace('$HR', sourceUrls.hoistReact);
}

const DOCS_ROUTE = 'default.docs.docRef';

/** Source repo tokens (matching the `$HR`/`$HC` url prefixes) → doc viewer source names. */
const DOC_SOURCE_TOKENS: Record<string, string> = {
    $HR: 'hoist-react',
    $HC: 'hoist-core'
};

/**
 * Parse a Markdown doc url (e.g. `$HR/cmp/grid/README.md#tree-grids`) into the params needed to
 * route into Toolbox's document viewer: the `source` repo, the `docId` (file path, with `/`
 * encoded as `~` for the route), and an optional `section` (an H2 slug). Returns null for any url
 * that is not a repo-relative `.md` doc, so source-code and external links fall through to the
 * standard external-link behavior.
 */
function docRouteParams(url: string): {source: string; docId: string; section: string} | null {
    const [token, ...rest] = url.split('/');
    const source = DOC_SOURCE_TOKENS[token];
    if (!source || rest.length === 0) return null;

    const [path, section] = rest.join('/').split('#');
    if (!path.endsWith('.md')) return null;

    return {source, docId: path.replaceAll('/', '~'), section: section ?? null};
}

function createDefaultText(url: string) {
    const start = url.lastIndexOf('/'),
        end = url.includes('#') ? url.lastIndexOf('#') : url.length;

    return url.substring(start + 1, end);
}
