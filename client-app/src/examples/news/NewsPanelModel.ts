import {HoistModel, LoadSpec, managed, XH} from '@xh/hoist/core';
import {action, bindable, observable, makeObservable} from '@xh/hoist/mobx';
import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {appendFilter, FilterLike, StoreRecord} from '@xh/hoist/data';
import {uniq, map} from 'lodash';

import {newsPanelItem} from './NewsPanelItem';
import {p, vbox} from '@xh/hoist/cmp/layout';

export class NewsPanelModel extends HoistModel {
    override telemetryPrefix = 'toolbox.client.news';

    SEARCH_FIELDS = ['title', 'text'];

    @managed
    viewModel = new DataViewModel({
        emptyText: vbox([
            p('No news found...'),
            p('Have you properly configured the newsApiKey config?')
        ]),
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
        itemHeight: 140,
        showHover: true,
        rowBorders: true,
        stripeRows: true
    });

    @observable.ref
    sourceOptions: string[] = [];
    @bindable.ref
    private sourceFilterValues: string[] = null;
    private lastRefresh: Date;

    constructor() {
        super();
        makeObservable(this);

        this.addReaction({
            track: () => [this.sourceFilterValues, this.lastRefresh],
            run: () => this.setSourceFilter()
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        await this.runner({loadSpec})
            .span('load')
            .run(async ctx => {
                const stories = await XH.fetchJson({url: 'news'}, ctx);
                this.completeLoad(stories);
            });
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

        const filter = appendFilter(store.filter?.removeFieldFilters('source'), newFilter);
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

    openStory(record: StoreRecord) {
        const url = record?.get('url');
        if (url) XH.openWindow(url, 'tb-news');
    }

    private onRowDoubleClicked({data: record}) {
        this.openStory(record);
    }
}
