/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import React, {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {dataView} from '@xh/hoist/desktop/cmp/dataview';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {filler} from '@xh/hoist/cmp/layout';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {select} from '@xh/hoist/desktop/cmp/input';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {refreshButton} from '@xh/hoist/desktop/cmp/button';
import {storeCountLabel} from '@xh/hoist/desktop/cmp/store';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {NewsPanelModel} from './NewsPanelModel';
import './NewsPanelItem.scss';

@HoistComponent
export class NewsPanel extends Component {

    model = new NewsPanelModel();
    
    render() {
        const {model} = this,
            {viewModel} = model;

        return panel({
            className: 'toolbox-news-panel',
            title: 'News Feed',
            icon: Icon.news(),
            width: '75%',
            height: '90%',
            item: dataView({
                model: viewModel,
                rowCls: 'news-item',
                itemHeight: 120,
                onRowDoubleClicked: this.onRowDoubleClicked
            }),
            mask: model.loadModel,
            tbar: toolbar({
                items: [
                    refreshButton({
                        text: 'Refresh',
                        model
                    }),
                    filler(),
                    relativeTimestamp({
                        timestamp: model.lastRefresh,
                        options: {prefix: 'Last Updated:'}
                    })

                ]
            }),
            bbar: toolbar({
                items: [
                    storeFilterField({
                        onFilterChange: this.onFilterChange,
                        includeFields: model.SEARCH_FIELDS,
                        placeholder: 'Filter by title...'
                    }),
                    select({
                        model,
                        bind: 'sourceFilter',
                        options: model.sourceOptions,
                        enableMulti: true,
                        placeholder: 'Filter by source...',
                        menuPlacement: 'top',
                        width: 380
                    }),
                    filler(),
                    storeCountLabel({
                        store: viewModel.store,
                        unit: 'stories'
                    })
                ]
            })
        });
    }

    onRowDoubleClicked = (e) => {
        if (e.data.url) window.open(e.data.url, '_blank');
    };

    onFilterChange = (f) => {
        this.model.setTextFilter(f);
    };
}

export const newsPanel = elemFactory(NewsPanel);

