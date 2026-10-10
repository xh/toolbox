import {badge} from '@xh/hoist/cmp/badge';
import {card} from '@xh/hoist/cmp/card';
import {filler, hbox, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {clipboardButton} from '@xh/hoist/desktop/cmp/clipboard';
import {codeInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import type {ReactNode} from 'react';
import {FaviconModel} from '../../FaviconModel';
import {FAVICON_FILE_NAMES} from '../../lib/FaviconExport';

/** How to install the download - the files in the zip, and the `configureRsbuild()` snippet. */
export const snippetCard = hoistCmp.factory({
    displayName: 'SnippetCard',
    model: uses(FaviconModel),

    render({model}) {
        return card({
            title: 'Add it to your Hoist app',
            icon: Icon.code(),
            className: 'tb-fav-snippet',
            items: [
                step(1, [
                    span('Unzip into'),
                    span({items: [code('client-app/public'), ':']}),
                    ...FAVICON_FILE_NAMES.map(name =>
                        span({key: name, className: 'tb-fav-chip', item: name})
                    )
                ]),
                step(2, [
                    span('Merge into'),
                    code('configureRsbuild()'),
                    span('in rsbuild.config.mjs:'),
                    filler(),
                    clipboardButton({
                        text: 'Copy SVG',
                        icon: Icon.copy(),
                        outlined: true,
                        tooltip: 'Just need the vector? Copy the SVG markup for inline use.',
                        getCopyText: () => model.svg,
                        successMessage: 'SVG markup copied to clipboard.'
                    })
                ]),
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

/** A numbered instruction row - wraps when narrow. */
function step(num: number, items: ReactNode[]) {
    return hbox({
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '4px 6px',
        items: [badge({intent: 'primary', marginLeft: 0, item: num}), ...items]
    });
}

function code(text: string) {
    return span({className: 'tb-fav-snippet__code', item: text});
}
