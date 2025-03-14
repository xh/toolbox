import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {action, bindable, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {div, hbox} from '@xh/hoist/cmp/layout';
import {GridModel} from '@xh/hoist/cmp/grid';
import {withFilterByField, withFilterByKey} from '@xh/hoist/data';
import {isEmpty, uniq, without} from 'lodash';

import {PERSIST_APP} from '../AppModel';
import {favoriteButton} from './cmp/FavoriteButton';
import {DetailsPanelModel} from './details/DetailsPanelModel';
import {cellPhoneCol, emailCol, locationCol, nameCol, workPhoneCol} from '../../../core/columns';
import {FilterLike} from '@xh/hoist/data/filter/Types';

/**
 * Primary model to load a list of contacts from the server and manage filter and selection state.
 * Support showing results in a grid or tiled set of photos.
 */
export class DirectoryPanelModel extends HoistModel {
    override persistWith = PERSIST_APP;

    /** known tags across all contacts. */
    @observable.ref tagList: string[] = [];

    /** known locations across all contacts. */
    @observable.ref locationList: string[] = [];

    /**  tag(s) used to filter results. If multiple, recs must match all. */
    @bindable.ref tagFilters: string[] = [];

    @bindable locationFilter: string;

    @bindable @persist displayMode: 'grid' | 'tiles' = 'tiles';

    @managed detailsPanelModel: DetailsPanelModel;

    @managed gridModel: GridModel;

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    get records() {
        return this.gridModel.store.records;
    }

    constructor() {
        super();
        makeObservable(this);

        const gridModel = (this.gridModel = this.createGridModel());
        this.detailsPanelModel = new DetailsPanelModel(this);

        this.addReaction({
            track: () => gridModel.selectedRecord,
            run: rec => this.detailsPanelModel.setCurrentRecord(rec)
        });

        this.addReaction({
            track: () => this.locationFilter,
            run: () => this.updateLocationFilter()
        });

        this.addReaction({
            track: () => this.tagFilters,
            run: () => this.updateTagFilter()
        });
    }

    async updateContactAsync(id, data) {
        await XH.contactService.updateContactAsync(id, data);
        await this.loadAsync();
    }

    toggleFavorite(record) {
        XH.contactService.toggleFavorite(record.id);
        // Update store directly, to avoid more heavyweight full reload.
        this.gridModel.store.modifyRecords({id: record.id, isFavorite: !record.data.isFavorite});
    }

    //------------------------
    // Implementation
    //------------------------
    override async doLoadAsync(loadSpec) {
        const {gridModel} = this;

        try {
            const contacts = await XH.contactService.getContactsAsync();
            runInAction(() => {
                this.tagList = uniq(contacts.flatMap(it => it.tags ?? [])).sort() as string[];
                this.locationList = uniq(contacts.map(it => it.location)).sort() as string[];
            });

            gridModel.loadData(contacts);
            gridModel.preSelectFirstAsync();
        } catch (e) {
            XH.handleException(e);
        }
    }

    private updateLocationFilter() {
        const {locationFilter, gridModel} = this,
            {store} = gridModel,
            newFilter: FilterLike = locationFilter
                ? {field: 'location', op: '=', value: locationFilter}
                : null;

        const filter = withFilterByField(store.filter, newFilter, 'location');
        store.setFilter(filter);
    }

    private updateTagFilter() {
        const {tagFilters, gridModel} = this,
            {store} = gridModel,
            newFilter = !isEmpty(tagFilters)
                ? {
                      key: 'tags',
                      testFn: rec => tagFilters.every(tag => rec.data.tags?.includes(tag))
                  }
                : null;

        const filter = withFilterByKey(store.filter, newFilter, 'tags');
        store.setFilter(filter);
    }

    private createGridModel() {
        return new GridModel({
            store: {
                fields: [
                    {name: 'isFavorite', type: 'bool'},
                    {name: 'profilePicture', type: 'string'},
                    {name: 'bio', type: 'string'},
                    {name: 'tags', type: 'auto'}
                ]
            },
            emptyText: 'No matching contacts found.',
            colChooserModel: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            colDefaults: {width: 160},
            persistWith: this.persistWith,
            groupBy: 'isFavorite',
            groupRowRenderer: ({value}) => (value === 'true' ? 'Favorites' : 'XH Engineers'),
            groupSortFn: (a, b) => (a < b ? 1 : -1),
            columns: [
                {
                    field: 'isFavorite',
                    headerName: null,
                    align: 'center',
                    resizable: false,
                    width: 40,
                    renderer: this.isFavoriteRenderer,
                    excludeFromExport: true
                },
                {...nameCol},
                {...locationCol},
                {...emailCol},
                {...cellPhoneCol, hidden: true},
                {...workPhoneCol, hidden: true},
                {
                    field: 'tags',
                    width: 400,
                    renderer: this.tagsRenderer
                }
            ]
        });
    }

    @action
    private toggleTag(tag) {
        const tagFilters = this.tagFilters ?? [];
        this.tagFilters = tagFilters.includes(tag)
            ? without(tagFilters, tag)
            : [...tagFilters, tag];
    }

    private isFavoriteRenderer = (v, {record}) => {
        return favoriteButton({model: this, record});
    };

    private tagsRenderer = v => {
        if (isEmpty(v)) return null;

        return hbox({
            className: 'tb-contact-tag-container',
            items: v.map(tag =>
                div({
                    className: 'tb-contact-tag',
                    item: tag,
                    onClick: () => this.toggleTag(tag)
                })
            )
        });
    };
}
