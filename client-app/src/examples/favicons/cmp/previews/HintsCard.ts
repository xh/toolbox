import {card} from '@xh/hoist/cmp/card';
import {div, hbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import type {ReactNode} from 'react';
import {FaviconModel} from '../../FaviconModel';

/**
 * Design checks - contrast, thin strokes and (when framed) how to see the live tab icon. Shows an
 * all-clear note when there is nothing to flag, so the previews grid keeps a stable layout. The card
 * takes a warning intent only when a check flags the design - the all-clear state stays neutral.
 */
export const hintsCard = hoistCmp.factory({
    displayName: 'HintsCard',
    model: uses(FaviconModel),

    render({model}) {
        const {hints, isFramed} = model,
            hasWarnings = hints.some(it => it.type === 'warning');
        return card({
            title: 'Checks',
            icon: hasWarnings ? Icon.warning() : Icon.checkCircle(),
            intent: hasWarnings ? 'warning' : null,
            className: 'tb-fav-hints',
            items: [
                hasWarnings
                    ? null
                    : hintItem([
                          Icon.checkCircle({intent: 'success'}),
                          div('Looking sharp - good contrast, and solid strokes at every size.')
                      ]),
                ...hints.map(({type, text}) =>
                    hintItem(
                        [
                            type === 'warning'
                                ? Icon.warning({intent: 'warning'})
                                : Icon.info({intent: 'primary'}),
                            div(text)
                        ],
                        text
                    )
                ),
                isFramed
                    ? button({
                          alignSelf: 'flex-start',
                          text: 'Open in full tab',
                          icon: Icon.openExternal(),
                          outlined: true,
                          intent: 'primary',
                          onClick: () => XH.openWindow(model.shareUrl)
                      })
                    : null
            ]
        });
    }
});

function hintItem(items: ReactNode[], key?: string) {
    return hbox({key, className: 'tb-fav-hints__item', alignItems: 'flex-start', gap: 8, items});
}
