import {hoistCmp} from '@xh/hoist/core';
import {div, hbox, img, vbox} from '@xh/hoist/cmp/layout';
import {fmtCompactDate} from '@xh/hoist/format';
import {compact, uniq} from 'lodash';
// @ts-ignore
import stockPhoto from '../../core/img/stock-news.png';

export const newsPanelItem = hoistCmp.factory({
    model: null,

    render({record}) {
        const {title, text, imageUrl, published, source, author} = record.data,
            // Combine source/date/author into a single meta line, dropping any blanks and
            // de-duping when source and author are the same (a common case in the feed).
            meta = uniq(compact([source, fmtCompactDate(published), author])).join('  •  ');

        return hbox({
            className: 'news-item',
            items: [
                vbox({
                    className: 'news-item__body',
                    items: [
                        div({className: 'news-item__meta', item: meta}),
                        div({className: 'news-item__title', item: title}),
                        div({className: 'news-item__desc', item: text})
                    ]
                }),
                div({
                    className: 'news-item__media',
                    item: img({
                        src: imageUrl || stockPhoto,
                        alt: '',
                        loading: 'lazy',
                        // Many NewsAPI image URLs are stale or blocked - swap in the stock photo
                        // on load failure, clearing the handler first to avoid a fallback loop.
                        onError: e => {
                            const el = e.target as HTMLImageElement;
                            el.onerror = null;
                            el.src = stockPhoto;
                        }
                    })
                })
            ]
        });
    }
});
