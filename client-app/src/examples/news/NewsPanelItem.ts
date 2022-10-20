import {hoistCmp} from '@xh/hoist/core';
import {box, div, p, img, hframe} from '@xh/hoist/cmp/layout';
// @ts-ignore
import stockPhoto from '../../core/img/stock-news.png';
import {fmtCompactDate} from '@xh/hoist/format';

export const newsPanelItem = hoistCmp.factory({
    model: null,

    render({record}) {
        const {title, text, imageUrl, published, source, author} = record.data;

        const fmtPublished = fmtCompactDate(published);
        return hframe({
            className: 'news-item',
            items: [
                box({
                    className: 'text-container',
                    item: div(
                        p({className: 'news-item--text', item: `${source} | ${fmtPublished}`}),
                        p({className: 'news-item--title overflow-ellipsis', item: title}),
                        p({className: 'news-item--text overflow-ellipsis', item: text}),
                        p({className: 'news-item--text', item: author})
                    )
                }),
                box({
                    className: 'img-container',
                    item: div({
                        className: 'news-item--img',
                        item: img({src: imageUrl ? imageUrl : stockPhoto, alt: 'Story image'})
                    })
                })
            ]
        });
    }
});
