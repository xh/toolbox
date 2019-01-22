/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {XH, HoistModel} from '@xh/hoist/core';
import {action, observable, bindable} from '@xh/hoist/mobx';
import {uniq, isEmpty} from 'lodash';
import {DataViewModel} from '@xh/hoist/desktop/cmp/dataview';
import {LocalStore} from '@xh/hoist/data';
import {newsPanelItem} from './NewsPanelItem';
import {fmtCompactDate} from '@xh/hoist/format';


@HoistModel
export class NewsPanelModel {

    SEARCH_FIELDS = ['title', 'text'];

    viewModel = new DataViewModel({
        store: new LocalStore({
            fields: ['title', 'source', 'text', 'url', 'imageUrl', 'author', 'published']
        }),
        itemRenderer: (v, {record}) => newsPanelItem({record})
    });

    @observable.ref sourceOptions = [];
    @observable lastRefresh = null;

    @bindable sourceFilter = null;
    @observable.ref textFilter = null;

    @action
    setTextFilter(filter) {
        this.textFilter = filter;
    }

    constructor() {
        this.addReaction({
            track: () => [this.sourceFilter, this.textFilter, this.lastRefresh],
            run: () => this.filterData(),
            runImmediately: true
        });
    }

    loadAsync()  {
        return XH
            .fetchJson({url: 'news'})
            .then(stories => this.completeLoad(stories));
    }

    //------------------------
    // Implementation
    //------------------------
    @action
    completeLoad(stories) {
        const {store} = this.viewModel;
        store.loadData(Object.values(stories).map((s) => {
            return {
                title: s.title,
                source: s.source,
                published: s.published ? fmtCompactDate(s.published) : null,
                text: s.text,
                url: s.url,
                imageUrl: s.imageUrl,
                author: s.author
            };
        }));
        this.sourceOptions = uniq(store.records.map(story => story.source));
        this.lastRefresh = new Date();
    }

    @action
    filterData() {
        const filter = (rec) => {
            const {textFilter, sourceFilter} = this,
                searchMatch = !textFilter || textFilter(rec),
                sourceMatch = isEmpty(sourceFilter) || sourceFilter.includes(rec.source);

            return sourceMatch && searchMatch;
        };

        this.viewModel.store.setFilter(filter);
    }

    destroy() {
        XH.safeDestroy(this.viewModel);
    }
}