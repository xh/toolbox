import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/Icon';
import {bindable, observable, makeObservable, action} from '@xh/hoist/mobx';
import {without, uniq, isEmpty} from 'lodash';
import {PERSIST_APP} from './AppModel';
import {DetailsPanelModel} from './detail/DetailsPanelModel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {div, hbox} from '@xh/hoist/cmp/layout';

/**
 * Primary model to load a list of contacts from the server and manage filtering and selection state.
 */

export class DirectoryPanelModel extends HoistModel {

    persistWith = PERSIST_APP;

    /**
     * @member {string[]} - ids of all contacts that the user has favorited.
     */
    @observable.ref
    @persist
    userFaves = [];

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

    /** @member {string[]} - when multiple tags are selected for filtering, the grid will display all records matching all selected tags */
    @bindable.ref
    tagFilters;

    /**
     * @member {string} - options are 'grid' and 'tiled'. In 'grid' mode, contacts are displayed in an interactive table. In
     * 'tiled' mode, contacts are displayed as tiled profile pictures.
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
            track: () => [this.locationFilter, this.searchQuery, this.tagFilters],
            run: () => this.updateFilter(),
            fireImmediately: true
        });
    }

    //------------------------
    // Implementation
    //------------------------
    @action
    async doLoadAsync(loadSpec) {
        const {gridModel, userFaves} = this;

        try {
            const contacts = await XH.fetchJson({
                url: 'contacts'
            }).track({category: 'Contacts', message: 'Loaded contacts.'});

            contacts.forEach(it => it.isFavorite = userFaves.includes(it.id));
            this.tagList = uniq(contacts.flatMap(it => it.tags ?? []));
            this.locationList = uniq(contacts.map(it => it.location));

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
                    elementRenderer: (val, {record}) => this.renderFavorite(record)
                },
                {
                    field: 'name'
                },
                {
                    field: 'location'
                },
                {
                    field: 'workPhone'
                },
                {
                    field: 'homePhone',
                    hidden: true
                },
                {
                    field: 'cellPhone',
                    hidden: true
                },
                {
                    field: 'email'
                },
                {
                    field: 'tags',
                    hidden: true,
                    width: 300,
                    elementRenderer: (val, {record}) => {
                        if (!record.data.tags) return null;

                        return hbox({
                            className: 'metadata-tag-container',
                            items: record.data.tags?.map(tag =>
                                div({
                                    className: 'metadata-tag',
                                    item: tag,
                                    onClick: () => this.toggleTag(tag)
                                })

                            )
                        });
                    }
                }
            ]
        });
    }

    @action
    toggleFavorite(record) {
        const {userFaves} = this;
        const {store} = this.gridModel;

        this.userFaves = record.data.isFavorite ? without(userFaves, record.id) : [...userFaves, record.id];
        store.modifyRecords({id: record.id, isFavorite: !record.data.isFavorite});
    }

    @action
    toggleTag(tag) {
        let tagFilters = this.tagFilters ?? [];

        this.tagFilters = tagFilters.includes(tag) ?
            without(tagFilters, tag) :
            [...tagFilters, tag];
    }

    renderFavorite(record) {
        const {isFavorite} = record.data;

        return button({
            icon: Icon.favorite({
                color: isFavorite ? 'gold' : null,
                prefix: isFavorite ? 'fas' : 'far'
            }),
            onClick: () => this.toggleFavorite(record)
        });
    }

    async updateContactAsync(id, update) {
        const {gridModel} = this;

        const contacts = await XH.fetchService.postJson({
            url: `contacts/update/${id}`,
            body: update
        });

        gridModel.loadData(contacts);
    }
}
