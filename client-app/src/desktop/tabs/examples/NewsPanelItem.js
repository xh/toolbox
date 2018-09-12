import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core/index';
import {hbox, box} from '@xh/hoist/cmp/layout/index';
import stockPhoto from '../../../core/img/stock-news.png';
import React from 'react';

@HoistComponent
class NewsPanelItem extends Component {

    render() {
        const request = this.props.record,
            {title, url, text, imageUrl, published, source, author} = request;

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
        )
    }
}

export const newsPanelItem = elemFactory(NewsPanelItem);
