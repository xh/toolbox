import {XH, HoistModel, managed, LoadSupport} from '@xh/hoist/core';
import {action, observable, bindable} from '@xh/hoist/mobx';
import {uniq, isEmpty} from 'lodash';
import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {newsPanelItem} from './NewsPanelItem';
import {fmtCompactDate} from '@xh/hoist/format';

@HoistModel
@LoadSupport
export class NewsPanelModel {

    SEARCH_FIELDS = ['title', 'text'];

    @managed
    viewModel = new DataViewModel({
        sortBy: 'published',
        store: {
            fields: ['title', 'source', 'text', 'url', 'imageUrl', 'author', 'published'],
            idSpec: XH.genId,
            filter: (rec) => {
                const {textFilter, sourceFilter} = this,
                    searchMatch = !textFilter || textFilter.fn(rec),
                    sourceMatch = isEmpty(sourceFilter) || sourceFilter.includes(rec.data.source);

                return sourceMatch && searchMatch;
            }
        },
        itemRenderer: (v, {record}) => newsPanelItem({record}),
        itemHeight: 120,
        rowClassFn: () => 'news-item',
        stripeRows: true
    });

    @observable.ref sourceOptions = [];
    @observable lastRefresh = null;

    @bindable sourceFilter = null;
    @bindable.ref textFilter = null;

    constructor() {
        this.addReaction({
            track: () => [this.sourceFilter, this.textFilter, this.lastRefresh],
            run: () => this.viewModel.store.refreshFilter(),
            fireImmediately: true
        });
    }

    async doLoadAsync(loadSpec)  {
        await XH
            .fetchJson({url: 'news', loadSpec})
            .wait(100)
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
        this.sourceOptions = uniq(store.records.map(story => story.data.source));
        this.lastRefresh = new Date();
    }
}
