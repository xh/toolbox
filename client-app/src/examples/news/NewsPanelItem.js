import {hoistCmp} from '@xh/hoist/core/index';
import {hbox, box} from '@xh/hoist/cmp/layout/index';
import stockPhoto from '../../core/img/stock-news.png';
import React from 'react';

export const newsPanelItem = hoistCmp.factory({
    model: null,

    render({record}) {
        const {title, text, imageUrl, published, source, author} = record.data;

        return hbox(
            box({
                className: 'text-container',
                item: [
                    <div>
                        <p className='news-item--text'>{source} | {published}</p>
                        <p className='news-item--title overflow-ellipsis'>{title}</p>
                        <p className='news-item--text overflow-ellipsis'>{text}</p>
                        <p className='news-item--text'>{author}</p>
                    </div>
                ]
            }),
            box({
                className: 'img-container',
                item: [
                    <div className='news-item--img'>
                        <img src={imageUrl ? imageUrl : stockPhoto} alt='Story image'/>
                    </div>
                ]
            })
        );
    }
});
