import {Component} from 'react';
import {HoistComponent, elemFactory, XH} from '@xh/hoist/core/index';
import {hbox, vbox, box} from '@xh/hoist/cmp/layout/index';
import {fmtNumber} from "@xh/hoist/format";
import {Icon} from "@xh/hoist/icon";
import logoDark from "../../../core/img/xhio+hoist-dark.png";
import logo from "../../../core/img/xhio+hoist.png";
import React from "react";

@HoistComponent
class NewsPanelItem extends Component {

    render() {
        const request = this.props.record,
            {title, url, text, imageUrl, published, source, author} = request;

        return hbox(
                vbox({
                    flex: 5,
                    items: [
                        box({
                            className: 'news-item--title',
                            item: [
                                <span className="overflow-ellipsis">{title}</span>
                            ]
                        }),
                        box({
                            className: 'news-item--text',
                            item: [
                                <p className="overflow-ellipsis">{text}</p>

                            ]
                        }),
                        box({
                            className: 'news-item--text',
                            item: [
                                <p>{author} | {source}</p>
                            ]
                        })
                    ]
                }),

                box({
                    flex: 1,
                    className: 'news-item--img',
                    item: [
                            <img src={imageUrl ? imageUrl : null} alt="Story image"/>
                        ]
                    })
                );
    }

    onClick (url) {
        window.open(url, "_blank")
    }
}

export const newsPanelItem = elemFactory(NewsPanelItem);
