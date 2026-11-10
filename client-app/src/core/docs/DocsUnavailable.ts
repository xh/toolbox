import {XH} from '@xh/hoist/core';

/** Message shown by the docs viewers when the docs could not be loaded. */
export const DOCS_UNAVAILABLE_MSG =
    'The Hoist docs could not be loaded. Try again, or read them on GitHub.';

/** Message shown in place of search results when a search fails. */
export const SEARCH_UNAVAILABLE_MSG = 'Search failed - try again.';

/** The hoist-react docs index on GitHub - a fallback when the docs could not be loaded. */
export function githubDocsUrl(): string {
    const hoistReact =
        XH.getConf('sourceUrls', {})?.hoistReact ??
        'https://github.com/xh/hoist-react/tree/develop';
    return `${hoistReact}/docs/README.md`;
}
