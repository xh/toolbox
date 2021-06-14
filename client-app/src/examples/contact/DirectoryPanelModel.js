import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {bindable, observable, makeObservable, action, runInAction} from '@xh/hoist/mobx';
import {without, uniq, isEmpty} from 'lodash';
import {DetailsPanelModel} from './cmp/DetailsPanelModel';
import {div, hbox} from '@xh/hoist/cmp/layout';
import {favoriteButton} from './cmp/FavoriteButton';

/**
 * Primary model to load a list of contacts from the server and manage filtering and selection state.
 * Support showing results in a grid or tiled set of photos.
 */
export class DirectoryPanelModel extends HoistModel {

    /**
     * @member {string[]} - set of known tags applied to all contacts
     */
    @observable.ref
    tagList = [];

    /**
     * @member {string[]} - set of known locations of all contacts
     */
    @observable.ref
    locationList = [];

    /** @member {string} - quick filter search term */
    @bindable
    searchQuery;

    /** @member {string} */
    @bindable
    locationFilter;

    /** @member {string[]}
     * When multiple tags are selected for filtering, the grid will display all records matching all selected tags
     */
    @bindable.ref
    tagFilters;

    /**
     * @member {string} - options are 'grid' and 'tiled'. In 'grid' mode, contacts are displayed in an interactive
     * table. In 'tiled' mode, contacts are displayed as tiled profile pictures.
     */
    @bindable
    displayMode = 'grid';

    /**
     * @member {DetailsPanelModel}
     */
    @managed
    detailsPanelModel;

    /** @member {GridModel} */
    @managed
    gridModel;

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    get records() {
        return this.gridModel.store.records;
    }

    constructor() {
        super();
        makeObservable(this);

        const gridModel = this.gridModel = this.createGridModel();
        this.detailsPanelModel = new DetailsPanelModel(this);

        this.addReaction({
            track: () => gridModel.selectedRecord,
            run: (rec) => this.detailsPanelModel.setCurrentRecord(rec)
        });

        this.addReaction({
            track: () => [this.searchQuery, this.locationFilter, this.tagFilters],
            run: () => this.updateFilter(),
            fireImmediately: true
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
    async doLoadAsync(loadSpec) {
        const {gridModel} = this;

        try {
            const contacts = await XH.contactService.getContactsAsync();
            runInAction(() => {
                this.tagList = uniq(contacts.flatMap(it => it.tags ?? []));
                this.locationList = uniq(contacts.map(it => it.location));
            });

            gridModel.loadData(contacts);
            await gridModel.preSelectFirstAsync();
        } catch (e) {
            XH.handleException(e);
        }
    }

    updateFilter() {
        const {searchQuery, locationFilter, tagFilters, gridModel} = this;

        gridModel.setFilter([
            searchQuery,
            locationFilter ? {field: 'location', op: '=', value: locationFilter} : null,
            !isEmpty(tagFilters) ?
                {testFn: (rec) => tagFilters.every(tag => rec.data.tags?.includes(tag))} :
                null
        ]);
    }

    createGridModel() {
        return new GridModel({
            store: {
                fields: ['profilePicture', 'bio']
            },
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            colDefaults: {width: 200},
            persistWith: this.persistWith,
            groupBy: 'isFavorite',
            groupRowRenderer: ({value}) => value === 'true' ? 'Favorites' : 'XH Engineers',
            groupSortFn: (a, b) => (a < b ? 1 : -1),
            columns: [
                {
                    field: 'isFavorite',
                    headerName: null,
                    align: 'center',
                    resizable: false,
                    width: 40,
                    elementRenderer: this.isFavoriteRenderer
                },
                {field: 'name'},
                {field: 'location'},
                {field: 'email'},
                {
                    field: 'tags',
                    width: 300,
                    elementRenderer: this.tagsRenderer
                },
                {
                    field: 'cellPhone',
                    hidden: true
                },
                {
                    field: 'workPhone',
                    hidden: true
                }
            ]
        });
    }

    @action
    toggleTag(tag) {
        const tagFilters = this.tagFilters ?? [];

        this.tagFilters = tagFilters.includes(tag) ? without(tagFilters, tag) : [...tagFilters, tag];
    }

    isFavoriteRenderer = (v, {record}) => {
        return favoriteButton({model: this, record});
    };

    tagsRenderer = (v) => {
        if (!v) return null;

        return hbox({
            className: 'metadata-tag-container',
            items: v.map(tag => (
                div({
                    className: 'metadata-tag',
                    item: tag,
                    onClick: () => this.toggleTag(tag)
                }))
            )
        });
    };
}