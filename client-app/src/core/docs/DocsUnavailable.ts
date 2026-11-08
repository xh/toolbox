import {XH} from '@xh/hoist/core';

/** Message shown by the docs viewers while the Hoist Docs service is unavailable. */
export const DOCS_UNAVAILABLE_MSG =
    'The Hoist docs are temporarily unavailable. Try again shortly, or read them on GitHub.';

/** Message shown in place of search results when a search fails to reach Hoist Docs. */
export const SEARCH_UNAVAILABLE_MSG = 'Search is unavailable right now - try again shortly.';

/** The hoist-react docs index on GitHub - a fallback while Hoist Docs is down. */
export function githubDocsUrl(): string {
    const hoistReact =
        XH.getConf('sourceUrls', {})?.hoistReact ??
        'https://github.com/xh/hoist-react/tree/develop';
    return `${hoistReact}/docs/README.md`;
}
