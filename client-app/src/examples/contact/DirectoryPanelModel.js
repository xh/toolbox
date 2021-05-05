import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, persist} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/Icon';
import {bindable, observable, makeObservable, action} from '@xh/hoist/mobx';
import {without} from 'lodash';
import {PERSIST_APP} from './AppModel';
import {DetailsPanelModel} from './detail/DetailsPanelModel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {FacebookModel} from './FacebookModel';

export class DirectoryPanelModel extends HoistModel {

    persistWith = PERSIST_APP;

    @observable.ref
    @persist
    userFaves = [];

    /** @member {function} */
    @bindable
    searchQuery;

    /** @member {string} */
    @bindable
    locationFilter = '';

    /** @member {string} */
    @bindable
    departmentFilter = '';

    @bindable
    displayMode = 'details';

    @bindable
    @persist
    showDetails = 'true';

    @managed
    detailsPanelModel = new DetailsPanelModel();

    /** @member {GridModel} */
    @managed
    gridModel;

    /** @member {FacebookModel} */
    @managed
    facebookModel;

    get currentRecord() {
        return this.gridModel.selectedRecord;
    }

    constructor() {
        super();
        makeObservable(this);

        const gridModel = this.gridModel = this.createGridModel();

        this.facebookModel = new FacebookModel({
            store: gridModel.store,
            selModel: gridModel.selModel
        });

        this.addReaction({
            track: () => gridModel.selectedRecord,
            run: (rec) => this.detailsPanelModel.setCurrentRecord(rec)
        });

        this.addReaction({
            track: () => [this.locationFilter, this.departmentFilter, this.searchQuery],
            run: () => this.gridModel.setFilter(this.createFilter()),
            fireImmediately: true
        });

        this.addReaction({
            track: () => this.groupBy,
            run: () => gridModel.setShowDetails()
        });

        this.setShowDetails(this.showDetails ? false : true);
    }


    //------------------------
    // Implementation
    //------------------------
    async doLoadAsync(loadSpec) {
        const {gridModel, facebookModel} = this;

        let entries = [
            {
                id: 0,
                name: 'Lee',
                location: 'NY',
                department: 'XH',
                workPhone: '(555) 555-5555',
                homePhone: '(555) 555-5555',
                cellPhone: '(555) 555-5555',
                email: 'x@xh.io',
                bio: 'add a bio'
            },
            {
                id: 1,
                name: 'Anselm',
                location: 'CA',
                department: 'XH',
                workPhone: '(555) 555-5555',
                homePhone: '(555) 555-5555',
                cellPhone: '(555) 555-5555',
                email: 'x@xh.io',
                bio: 'add a bio'
            },
            {
                id: 2,
                name: 'Tom',
                location: 'NY',
                department: 'XH',
                workPhone: '(555) 555-5555',
                homePhone: '(555) 555-5555',
                cellPhone: '(555) 555-5555',
                email: 'x@xh.io',
                bio: 'add a bio'
            },
            {
                id: 3,
                name: 'Petra',
                location: 'NY',
                department: 'XH',
                workPhone: '(555) 555-5555',
                homePhone: '(555) 555-5555',
                cellPhone: '(555) 555-5555',
                email: 'x@xh.io',
                bio: 'add a bio'
            },
            {
                id: 4,
                name: 'Collin',
                location: 'NY',
                department: 'XH',
                workPhone: '(555) 555-5555',
                homePhone: '(555) 555-5555',
                cellPhone: '(555) 555-5555',
                email: 'x@xh.io',
                bio: 'add a bio'
            },
            {
                id: 5,
                name: 'Saba',
                location: 'CA',
                department: 'XH',
                workPhone: '(555) 555-5555',
                homePhone: '(555) 555-5555',
                cellPhone: '(555) 555-5555',
                email: 'x@xh.io',
                bio: 'add a bio'
            },
            {
                id: 6,
                name: 'John',
                location: 'NY',
                department: 'XH',
                workPhone: '(555) 555-5555',
                homePhone: '(555) 555-5555',
                cellPhone: '(555) 555-5555',
                email: 'x@xh.io',
                bio: 'add a bio'
            }
        ];


        entries.forEach(entry => {
            entry.isFavorite = this.userFaves.includes(entry.id);
        });

        gridModel.loadData(entries);
        await gridModel.preSelectFirstAsync();

        facebookModel.loadData(entries);

        // try {
        //     let entries = await XH.fetchJson({
        //         url: 'recalls',
        //         params: {searchQuery: this.searchQuery},
        //         loadSpec
        //     });
        //
        //     if (loadSpec.isStale) return;
        //
        //     // Approximate (and enforce) a unique id for this rather opaque API
        //     entries.forEach(it => {
        //         it.id = it.openfda.brand_name[0] + it.recall_number;
        //     });
        //     entries = uniqBy(entries, 'id');
        //
        //     gridModel.loadData(entries);
        //     await gridModel.preSelectFirstAsync();
        // } catch (e) {
        //     XH.handleException(e);
        // }
    }

    createFilter() {
        const {searchQuery, locationFilter, departmentFilter} = this;
        return [
            searchQuery,
            locationFilter ? {field: 'location', op: '=', value: locationFilter} : null,
            departmentFilter ? {field: 'department', op: '=', value: departmentFilter} : null
        ];
    }

    createGridModel() {
        return new GridModel({
            store: {
                fields: ['department']
            },
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            persistWith: this.persistWith,
            columns: [
                {
                    field: 'isFavorite',
                    displayName: 'Favorites',
                    align: 'center',
                    width: 70,
                    elementRenderer: (val, {record}) => {
                        const {isFavorite} = record.data;

                        return button({
                            icon: Icon.favorite({
                                color: isFavorite ? 'gold' : null,
                                prefix: isFavorite ? 'fas' : 'far'
                            }),
                            onClick: () => this.toggleFavorite(record)
                        });

                    }
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
                    field: 'bio',
                    hidden: true
                }
            ]
        });
    }

    @action
    toggleFavorite(record) {
        const {userFaves} = this;
        this.userFaves = record.data.isFavorite ? without(userFaves, record.id) : [...userFaves, record.id];
        this.refreshAsync();
    }

}
