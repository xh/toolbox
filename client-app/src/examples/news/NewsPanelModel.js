import {HoistModel, managed, XH} from '@xh/hoist/core';
import {action, bindable, observable, makeObservable} from '@xh/hoist/mobx';
import {uniq, map} from 'lodash';
import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {newsPanelItem} from './NewsPanelItem';

export class NewsPanelModel extends HoistModel {

    SEARCH_FIELDS = ['title', 'text'];

    @managed
    viewModel = new DataViewModel({
        sortBy: 'published|desc',
        store: {
            fields: ['title', 'source', 'text', 'url', 'imageUrl', 'author', 'published'],
            filter: this.createFilter()
        },
        elementRenderer: (v, {record}) => newsPanelItem({record}),
        itemHeight: 120,
        rowBorders: true,
        stripeRows: true
    });

    @observable.ref sourceOptions = [];

    @bindable.ref sourceFilterValues = null;
    @bindable.ref textFilter = null;

    constructor() {
        super();
        makeObservable(this);
        this.addReaction({
            track: () => [this.sourceFilterValues, this.textFilter, this.lastRefresh],
            run: () => this.viewModel.setFilter(this.createFilter()),
            fireImmediately: true
        });
    }

    async doLoadAsync(loadSpec)  {
        const stories = await XH.fetchJson({url: 'news', loadSpec});
        this.completeLoad(stories);
    }

    //------------------------
    // Implementation
    //------------------------
    createFilter() {
        const {textFilter, sourceFilterValues} = this;
        return [
            textFilter,
            sourceFilterValues ? {field: 'source', op: '=', value: sourceFilterValues} : null
        ];
    }

    @action
    completeLoad(stories) {
        const {viewModel} = this;
        viewModel.loadData(stories);
        viewModel.preSelectFirstAsync();
        this.sourceOptions = uniq(map(viewModel.store.records, 'data.source'));
        this.lastRefresh = new Date();
    }
}
