import {vbox, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {DOCS_UNAVAILABLE_MSG, githubDocsUrl} from '../../../core/docs/DocsUnavailable';

/** Shown in place of the desktop docs viewer while the Hoist Docs service is unavailable. */
export const docsUnavailable = hoistCmp.factory({
    displayName: 'DocsUnavailable',

    render() {
        return vbox({
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            className: 'xh-text-color-muted',
            items: [
                Icon.book({size: '3x'}),
                span(DOCS_UNAVAILABLE_MSG),
                button({
                    text: 'Retry',
                    icon: Icon.refresh(),
                    intent: 'primary',
                    outlined: true,
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
