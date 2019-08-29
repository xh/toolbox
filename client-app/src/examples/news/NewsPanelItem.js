import {hoistElemFactory} from '@xh/hoist/core/index';
import {hbox, box} from '@xh/hoist/cmp/layout/index';
import stockPhoto from '../../core/img/stock-news.png';
import React from 'react';

export const newsPanelItem = hoistElemFactory(
    (props) => {
        const {title, text, imageUrl, published, source, author} = props.record;

        return hbox(
            box({
                flex: 4,
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
                flex: 2,
                className: 'img-container',
                item: [
                    <div className='news-item--img'>
                        <img src={imageUrl ? imageUrl : stockPhoto} alt='Story image'/>
                    </div>
                ]
            })
        );
    }
);
