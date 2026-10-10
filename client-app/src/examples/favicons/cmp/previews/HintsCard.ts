import {div} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {FaviconModel} from '../../FaviconModel';
import {previewCard} from './PreviewCard';

/**
 * Design checks - contrast, thin strokes and (when framed) how to see the live tab icon. Shows an
 * all-clear note when there is nothing to flag, so the previews grid keeps a stable layout.
 */
export const hintsCard = hoistCmp.factory({
    displayName: 'HintsCard',
    model: uses(FaviconModel),

    render({model}) {
        const {hints, isFramed} = model;
        return previewCard({
            title: 'Checks',
            icon: Icon.checkCircle(),
            className: 'tb-fav-hints',
            items: [
                hints.some(it => it.type === 'warning')
                    ? null
                    : div({
                          className: 'tb-fav-hints__item tb-fav-hints__item--ok',
                          items: [
                              Icon.checkCircle({intent: 'success'}),
                              div('Looking sharp - good contrast, and solid strokes at every size.')
                          ]
                      }),
                ...hints.map(({type, text}) =>
                    div({
                        key: text,
                        className: `tb-fav-hints__item tb-fav-hints__item--${type}`,
                        items: [
                            type === 'warning'
                                ? Icon.warning({intent: 'warning'})
                                : Icon.info({intent: 'primary'}),
                            div(text)
                        ]
                    })
                ),
                isFramed
                    ? button({
                          className: 'tb-fav-hints__full-tab',
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
