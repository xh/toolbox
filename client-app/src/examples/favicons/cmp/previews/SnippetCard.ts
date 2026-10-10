import {div, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {clipboardButton} from '@xh/hoist/desktop/cmp/clipboard';
import {codeInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {FaviconModel} from '../../FaviconModel';
import {FAVICON_FILE_NAMES} from '../../lib/FaviconExport';
import {previewCard} from './PreviewCard';

/** How to install the download - the files in the zip, and the `configureRsbuild()` snippet. */
export const snippetCard = hoistCmp.factory({
    displayName: 'SnippetCard',
    model: uses(FaviconModel),

    render({model}) {
        return previewCard({
            title: 'Add it to your Hoist app',
            icon: Icon.code(),
            className: 'tb-fav-snippet',
            headerItems: [
                clipboardButton({
                    text: 'Copy SVG',
                    icon: Icon.copy(),
                    outlined: true,
                    getCopyText: () => model.svg,
                    successMessage: 'SVG markup copied to clipboard.'
                })
            ],
            items: [
                div({
                    className: 'tb-fav-snippet__step',
                    items: [
                        span({className: 'tb-fav-snippet__num', item: '1'}),
                        span('Unzip into '),
                        span({className: 'tb-fav-snippet__code', item: 'client-app/public'}),
                        span(':'),
                        ...FAVICON_FILE_NAMES.map(name =>
                            span({key: name, className: 'tb-fav-chip', item: name})
                        )
                    ]
                }),
                div({
                    className: 'tb-fav-snippet__step',
                    items: [
                        span({className: 'tb-fav-snippet__num', item: '2'}),
                        span('Merge into '),
                        span({
                            className: 'tb-fav-snippet__code',
                            item: 'configureRsbuild()'
                        }),
                        span(' in rsbuild.config.mjs:')
                    ]
                }),
                codeInput({
                    className: 'tb-fav-snippet__editor',
                    value: model.configSnippet,
                    readonly: true,
                    language: 'javascript',
                    showCopyButton: true,
                    lineNumbers: false,
                    height: 170,
                    width: '100%'
                })
            ]
        });
    }
});
