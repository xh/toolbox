/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {NewsPanelModel} from './NewsPanelModel';
import {dataView} from '@xh/hoist/desktop/cmp/dataview';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';
import {filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {multiSelect} from '@xh/hoist/desktop/cmp/form';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {button} from '@xh/hoist/desktop/cmp/button';
import {storeCountLabel} from '@xh/hoist/desktop/cmp/store';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import './NewsPanelItem.scss';

@HoistComponent
export class NewsPanel extends Component {

    localModel = new NewsPanelModel();


    render() {
        const {model} = this,
            {viewModel} = model;

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
                        button({
                            text: 'Refresh Sources',
                            icon: Icon.refresh(),
                            onClick: this.onRefreshClick
                        }),
                        filler(),
                        relativeTimestamp({
                            timestamp: model.lastRefresh,
                            options: {prefix: 'Last updated: ', prefixMargin: 15}
                        })

                    ]
                }),
                bbar: toolbar({
                    items: [
                        storeFilterField({
                            onFilterChange: this.onFilterChange,
                            fields: model.SEARCH_FIELDS,
                            placeholder: 'Filter by title...'
                        }),
                        multiSelect({
                            placeholder: 'Filter by source...',
                            options: model.sourceOptions,
                            commitOnChange: true,
                            model,
                            field: 'sourceFilter'
                        }),
                        filler(),
                        storeCountLabel({
                            store: viewModel.store,
                            unit: 'stories'
                        })
                    ]
                })
            })
        });
    }

    loadAsync() {
        return this.model.loadAsync();
    }

    onRefreshClick = () => {
        this.model.loadAsync();
    };

    onRowDoubleClicked = (e) => {
        if (e.data.url) window.open(e.data.url, '_blank');
    };

    onFilterChange = (f) => {
        this.model.setTextFilter(f);
    };
}
