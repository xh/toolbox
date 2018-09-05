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
import {NewsPanelModel} from "./NewsPanelModel";
import {box, filler, vbox} from "@xh/hoist/cmp/layout";
import {dataView, DataViewModel} from '@xh/hoist/desktop/cmp/dataview';
import {LocalStore} from "@xh/hoist/data";
import {newsPanelItem} from "./NewsPanelItem";
import {Icon} from "@xh/hoist/icon";
import {toolbar} from "@xh/hoist/desktop/cmp/toolbar";
import {storeFilterField} from "@xh/hoist/desktop/cmp/store";
import {button} from "@xh/hoist/desktop/cmp/button";
import '../grids/DataViewItem.scss';




@HoistComponent()
export class NewsPanel extends Component {

    localModel = new DataViewModel({
        store: new LocalStore({
            fields: ['title', 'source', 'text', 'url']
        }),
        itemFactory: newsPanelItem
    });


    render() {
        const {model} = this;
        // let newsStories = [];
        // if (this.localModel.stories) newsStories = this.localModel.stories;
        return wrapper({
            // item: panel({
            //     width: '90%',
            //     item: vbox({
            //         flex: 1,
            //         items: [
            //             ...newsStories.map((story) => {
            //                 return panel({
            //                     title: story.title,
            //                     item: box({
            //                         padding: 10,
            //                         item: story.text
            //                     })
            //                 })
            //             })
            //         ]
            //     })
            // })
            item: panel({
                className: 'toolbox-dataview-panel',
                title: 'Grids > DataView',
                width: 700,
                height: 400,
                item: dataView({
                    model,
                    rowCls: 'dataview-item',
                    itemHeight: 70
                }),
                bbar: toolbar({
                    items: [
                        storeFilterField({
                            store: model.store,
                            fields: ['title']
                        }),
                        filler(),
                        button({
                            text: 'Reload Data',
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
                        text: s.text,
                        url: s.url
                    }
                })
            )
        }
    }



}
