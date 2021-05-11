import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, persist} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/Icon';
import {bindable, observable, makeObservable, action} from '@xh/hoist/mobx';
import {without} from 'lodash';
import {PERSIST_APP} from './AppModel';
import {DetailsPanelModel} from './detail/DetailsPanelModel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {JsonBlobService} from '@xh/hoist/svc';

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

    get currentRecord() {
        return this.gridModel.selectedRecord;
    }

    constructor() {
        super();
        makeObservable(this);

        const gridModel = this.gridModel = this.createGridModel();
        this.jsonBlob = new JsonBlobService();

        this.addReaction({
            track: () => gridModel.selectedRecord,
            run: (rec) => [this.detailsPanelModel.setCurrentRecord(rec), this.detailsPanelModel.setProfilePictureURL(rec.data.profilePicture)]
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
        const {gridModel} = this;
        let entries = [];

        try {
            let blobs = await this.jsonBlob.listAsync({
                type: 'ContactData',
                includeValue: true
            });

            blobs.forEach(blob => {
                entries.push({...blob.value, isFavorite: this.userFaves.includes(blob.value.id)});
            });

            gridModel.loadData(entries);
            await gridModel.preSelectFirstAsync();
        } catch (e) {
            console.error(e);
        }
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
                },
                {
                    field: 'profilePicture',
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
