import {Component} from 'react';
import {HoistComponent, elemFactory, XH} from '@xh/hoist/core/index';
import {hbox, vbox, box} from '@xh/hoist/cmp/layout/index';
import stockPhoto from "../../../core/img/stock-news.png";
import React from "react";

@HoistComponent
class NewsPanelItem extends Component {

    render() {
        const request = this.props.record,
            {title, url, text, imageUrl, published, source, author} = request;

        return hbox(
            vbox({
                flex: 4,
                items: [
                    box({
                        className: 'news-item--text',
                        item: [
                            <span>{source} | {published}</span>
                        ]
                    }),
                    box({
                        className: 'news-item--title',
                        item: [
                            <span className="overflow-ellipsis">{title}</span>
                        ]
                    }),
                    box({
                        className: 'news-item--text',
                        item: [
                            <span className="overflow-ellipsis">{text}</span>

                        ]
                    }),
                    box({
                        className: 'news-item--text',
                        item: [
                            <span>{author}</span>
                        ]
                    })
                ]
            }),
            vbox({
                flex: 2,
                className: 'news-item--img',
                item: [
                    box({
                        className: 'img-container',
                        item: [
                            <img src={imageUrl ? imageUrl : stockPhoto} alt="Story image"/>

                        ]
                    })
                ]

            })
        );
    }
}

export const newsPanelItem = elemFactory(NewsPanelItem);
