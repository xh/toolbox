import {a} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistProps, XH} from '@xh/hoist/core';
import {docRouteParams} from '../docs/DocUtils';

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
        const linkText = text || createDefaultText(url);

        // Markdown docs route into Toolbox's own document viewer for a fluid, in-app experience
        // rather than bouncing the user out to GitHub. Only the main desktop app registers the
        // viewer's route - other apps hosting this component (e.g. the admin console) fall
        // through to the external GitHub link below.
        const docRef = docRouteParams(url);
        if (docRef && hasDocsRoute()) {
            const params: Record<string, string> = {source: docRef.source, docId: docRef.docId};
            if (docRef.section) params.section = docRef.section;
            return a({
                href: XH.router.buildPath(DOCS_ROUTE, params),
                item: linkText,
                onClick: e => {
                    e.preventDefault();
                    XH.navigate(DOCS_ROUTE, params);
                }
            });
        }

        return a({
            href: toolboxUrl(url),
            item: linkText,
            target: '_blank'
        });
    }
});

export function toolboxUrl(url: string) {
    const sourceUrls = XH.getConf('sourceUrls');
    return url.replace('$TB', sourceUrls.toolbox).replace('$HR', sourceUrls.hoistReact);
}

const DOCS_ROUTE = 'default.docs.docRef';

/**
 * True if the hosting app registers the in-app docs viewer route - router5's `buildPath`
 * returns null for unknown route names, making it a safe probe.
 */
function hasDocsRoute(): boolean {
    return !!XH.router.buildPath(DOCS_ROUTE, {source: 'hoistReact', docId: 'probe'});
}

function createDefaultText(url: string) {
    const start = url.lastIndexOf('/'),
        end = url.includes('#') ? url.lastIndexOf('#') : url.length;

    return url.substring(start + 1, end);
}
