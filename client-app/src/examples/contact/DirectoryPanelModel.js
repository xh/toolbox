import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/Icon';
import {bindable, observable, makeObservable, action} from '@xh/hoist/mobx';
import {ONE_SECOND} from '@xh/hoist/utils/datetime';
import {without} from 'lodash';
import {PERSIST_APP} from './AppModel';
import {DetailsPanelModel} from './detail/DetailsPanelModel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {FacebookModel} from './FacebookModel'

// DMS: Look in admin for the tile example

export class DirectoryPanelModel extends HoistModel {

    persistWith = PERSIST_APP;

    @observable.ref
    @persist
    userFaves = [];

    @bindable
    searchQuery = '';

    @bindable
    displayMode = 'details';

    @bindable
    @persist
    showDetails = 'true'; // DMS: Maybe groupInput is the right input element for this, but I want something that's a slide-toggle

    @managed
    detailsPanelModel = new DetailsPanelModel();

    @managed
    gridModel = new GridModel({
        // store: {
        //     processRawData: this.processRecord
        // },
        emptyText: 'No records found...',
        colChooserModel: true,
        enableExport: true,
        rowBorders: true,
        showHover: true,
        persistWith: this.persistWith,
        columns: [
            {
                field: 'isFavorite',
                headerName: 'Favorites',
                align: 'center',
                width: 70,
                // renderer: this.favoriteRenderer,
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
                field: 'name',
                headerName: 'Name'
            },
            {
                field: 'location',
                headerName: 'Location'
            },
            {
                field: 'workPhone',
                headerName: 'Work Phone'
            },
            {
                field: 'homePhone',
                headerName: 'Home Phone',
                hidden: true
            },
            {
                field: 'cellPhone',
                headerName: 'Cell Phone',
                hidden: true
            },
            {
                field: 'email',
                headerName: 'Email'
            },
            {
                field: 'bio',
                headerName: 'Bio',
                hidden: true
            }
            // {
            //     field: 'classification',
            //     headerName: 'Class',
            //     align: 'center',
            //     width: 65,
            //     tooltip: (cls) => cls,
            //     elementRenderer: this.classificationRenderer
            // },
            // {
            //     field: 'recallDate',
            //     ...localDateCol,
            //     headerName: 'Date',
            //     width: 100,
            //     renderer: compactDateRenderer('MMM D')
            // }
        ]
    });

    @managed
    facebookModel = new FacebookModel()

    get currentRecord() {
        return this.gridModel.selectedRecord
    }

    constructor() {
        super();
        makeObservable(this);

        const {gridModel} = this;
        this.addReaction({
            track: () => gridModel.selectedRecord,
            run: (rec) => this.detailsPanelModel.setCurrentRecord(rec)
        });

        this.addReaction({
            track: () => this.searchQuery,
            run: () => this.loadAsync(),
            debounce: ONE_SECOND
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
                workPhone: '(555) 555-5555',
                homePhone: '(555) 555-5555',
                cellPhone: '(555) 555-5555',
                email: 'x@xh.io',
                bio: 'add a bio'
            }
        ]


        entries.forEach(entry => {
            entry.isFavorite = this.userFaves.includes(entry.id)
        })

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

    // processRecord(rawRec) {
    //     return {
    //         ...rawRec,
    //         isFavorite: this.userFaves.includes(rawRec.name)
    //     };
    // }

    @action
    toggleFavorite(record) {
        const {userFaves} = this;
        this.userFaves = record.data.isFavorite ? without(userFaves, record.id) : [...userFaves, record.id];
        this.refreshAsync();
    }

}
