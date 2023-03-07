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

function createDefaultText(url: string) {
    const start = url.lastIndexOf('/'),
        end = url.includes('#') ? url.lastIndexOf('#') : url.length;

    return url.substring(start + 1, end);
}
