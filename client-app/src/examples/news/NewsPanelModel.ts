import {HoistModel, managed, XH} from '@xh/hoist/core';
import {action, bindable, observable, makeObservable} from '@xh/hoist/mobx';
import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {withFilterByField, FilterLike} from '@xh/hoist/data';
import {uniq, map} from 'lodash';

import {newsPanelItem} from './NewsPanelItem';

export class NewsPanelModel extends HoistModel {
    SEARCH_FIELDS = ['title', 'text'];

    @bindable.ref
    newsErrorThrown: object;

    @managed
    viewModel = new DataViewModel({
        emptyText: 'No news found...',
        sortBy: 'published|desc',
        store: {
            fields: [
                {name: 'title', type: 'string'},
                {name: 'source', type: 'string'},
                {name: 'text', type: 'string'},
                {name: 'url', type: 'string'},
                {name: 'imageUrl', type: 'string'},
                {name: 'author', type: 'string'},
                {name: 'published', type: 'date'}
            ]
        },
        onRowDoubleClicked: this.onRowDoubleClicked,
        renderer: (v, {record}) => newsPanelItem({record}),
        itemHeight: 120,
        rowBorders: true,
        stripeRows: true
    });

    @observable.ref
    sourceOptions: string[] = [];
    @bindable.ref
    private sourceFilterValues = null;
    private lastRefresh: Date;

    constructor() {
        super();
        makeObservable(this);

        this.addReaction({
            track: () => [this.sourceFilterValues, this.lastRefresh],
            run: () => this.setSourceFilter()
        });
    }

    override async doLoadAsync(loadSpec) {
        try {
            const stories = await XH.fetchJson({url: 'news', loadSpec});
            this.completeLoad(stories);
        } catch (e) {
            this.newsErrorThrown = e;
        }
    }

    //------------------------
    // Implementation
    //------------------------
    private setSourceFilter() {
        const {sourceFilterValues} = this,
            {store} = this.viewModel,
            newFilter: FilterLike = sourceFilterValues
                ? {field: 'source', op: '=', value: sourceFilterValues}
                : null;

        const filter = withFilterByField(store.filter, newFilter, 'source');
        store.setFilter(filter);
    }

    @action
    private completeLoad(stories) {
        const {viewModel} = this;
        viewModel.loadData(stories);
        viewModel.preSelectFirstAsync();
        this.sourceOptions = uniq(map(viewModel.store.records, 'data.source'));
        this.lastRefresh = new Date();
    }

    private onRowDoubleClicked({data: record}) {
        const url = record.get('url');
        if (url) window.open(url, '_blank');
    }
}
