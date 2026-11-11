import {div, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {button} from '@xh/hoist/mobile/cmp/button';
import {DOCS_UNAVAILABLE_MSG, githubDocsUrl} from '../../../core/docs/DocsUnavailable';

/** Shown in place of the mobile docs screens when the docs could not be loaded. */
export const docsUnavailable = hoistCmp.factory({
    displayName: 'DocsUnavailable',

    render() {
        return div({
            className: 'tb-docs-search__empty',
            items: [
                Icon.book({size: '2x'}),
                span(DOCS_UNAVAILABLE_MSG),
                button({
                    text: 'Retry',
                    icon: Icon.refresh(),
                    onClick: () => XH.docService.retryAsync()
                }),
                button({
                    text: 'Open docs on GitHub',
                    icon: Icon.openExternal(),
                    minimal: true,
                    onClick: () => window.open(githubDocsUrl(), '_blank')
                })
            ]
        });
    }
});
