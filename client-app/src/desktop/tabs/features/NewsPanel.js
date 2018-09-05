/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import React, {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';
import {box, filler, vbox, div} from "@xh/hoist/cmp/layout";
import {dataView, DataViewModel} from '@xh/hoist/desktop/cmp/dataview';
import {LocalStore} from "@xh/hoist/data";
import {newsPanelItem} from "./NewsPanelItem";
import {Icon} from "@xh/hoist/icon";
import {toolbar} from "@xh/hoist/desktop/cmp/toolbar";
import {storeFilterField} from "@xh/hoist/desktop/cmp/store";
import {button} from "@xh/hoist/desktop/cmp/button";
import './NewsPanelItem.scss';




@HoistComponent
export class NewsPanel extends Component {

    localModel = new DataViewModel({
        store: new LocalStore({
            fields: ['title', 'source', 'text', 'url', 'imageUrl', 'author']
        }),
        itemFactory: newsPanelItem
    });


    render() {
        const {model} = this;
        return wrapper({
            item: panel({
                className: 'toolbox-news-panel',
                title: 'News Feed',
                width: '75%',
                height: '90%',
                item: dataView({
                    model,
                    rowCls: 'news-item',
                    itemHeight: 100
                }),
                bbar: toolbar({
                    items: [
                        storeFilterField({
                            placeholder: 'Filter by title or content...',
                            store: model.store,
                            fields: ['title']
                        }),
                        filler(),
                        button({
                            text: 'Refresh Sources',
                            icon: Icon.refresh(),
                            onClick: this.loadData
                        })
                    ]
                })
            })
        })
    }

    componentDidMount() {
        this.loadData();
    }

    loadData = () => {
        return XH
            .fetchJson({url: 'news'})
            .then(stories => {
                this.completeLoad(true, stories);
            }).catch(e => {
                this.completeLoad(false, e);
                XH.handleException(e);
            });

    };

    completeLoad(success, vals) {
        const {store} = this.model;
        if (success) {
            store.loadData(Object.values(vals).map((s) => {
                    return {
                        title: s.title,
                        source: s.source,
                        published: s.published,
                        text: s.text,
                        url: s.url,
                        imageUrl: s.imageUrl,
                        author: s.author
                    }
                })
            )
        }
    }



}
