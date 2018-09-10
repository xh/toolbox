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
import {filler} from "@xh/hoist/cmp/layout";
import {dataView} from '@xh/hoist/desktop/cmp/dataview';
import {Icon} from "@xh/hoist/icon";
import {toolbar} from "@xh/hoist/desktop/cmp/toolbar";
import {storeFilterField} from "@xh/hoist/desktop/cmp/store";
import {multiSelectField} from "@xh/hoist/desktop/cmp/form";
import {button} from "@xh/hoist/desktop/cmp/button";
import './NewsPanelItem.scss';
import {NewsPanelModel} from "./NewsPanelModel";
import {storeCountLabel} from '@xh/hoist/desktop/cmp/store';
import {relativeTimestamp} from "@xh/hoist/cmp/relativetimestamp"
import {fmtCompactDate} from "@xh/hoist/format"



@HoistComponent
export class NewsPanel extends Component {

    localModel = new NewsPanelModel();


    render() {
        const {viewModel} = this.model;

        return wrapper({
            item: panel({
                className: 'toolbox-news-panel',
                title: 'News Feed',
                width: '75%',
                height: '90%',
                item: dataView({
                    model: viewModel,
                    rowCls: 'news-item',
                    itemHeight: 120,
                    onRowDoubleClicked: this.onRowDoubleClicked
                }),
                tbar: toolbar({
                    items: [
                        filler(),
                        storeCountLabel({
                            store: viewModel.store,
                            unit: 'stories'
                        }),
                        relativeTimestamp({
                            timestamp: this.model.lastRefresh
                        })
                    ]
                }),
                bbar: toolbar({
                    items: [
                        storeFilterField({
                            placeholder: 'Filter by title or content...',
                            store: viewModel.store,
                            fields: ['title']
                        }),
                        multiSelectField({
                            placeholder: "Filter sources...",
                            options: this.model.sourceOptions,
                            commitOnChange: true,
                            onCommit: this.onCommit,
                            model: this.model,
                            field: 'sourceSelected'
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
        const {store} = this.model.viewModel;
        const today = (new Date()).getDate();
        if (success) {
            store.loadData(Object.values(vals).map((s) => {
                    return {
                        title: s.title,
                        source: s.source,
                        published: s.published ? fmtCompactDate(s.published) : null,
                        text: s.text,
                        url: s.url,
                        imageUrl: s.imageUrl,
                        author: s.author
                    }
                })
            );
            this.model.updateSourceOptions();
            this.model.refreshTimestamp()
        } else {
            store.loadData([])
        }
    };

    onRowDoubleClicked = (e) => {
        if (e.data.url) window.open(e.data.url, '_blank')
    };

    onCommit = () => {
        const {store} = this.model.viewModel;
        const {sourceSelected} = this.model;
        let filter = null;
        if (sourceSelected) {
            filter = (rec) => sourceSelected.includes(rec.source)
        }
        store.setFilter(filter);
    }
}
