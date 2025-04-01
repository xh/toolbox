import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {bindable, makeObservable, action} from '@xh/hoist/mobx';
import {GridModel} from '@xh/hoist/cmp/grid';
import {nameCol, locationCol} from '../../../core/columns';

// Shared from the desktop version
import {PERSIST_APP} from '../svc/ContactService';

import AppModel from './AppModel';

export default class ContactsPageModel extends HoistModel {
    override persistWith = PERSIST_APP;

    @bindable @persist displayMode: 'grid' | 'tiles' = 'tiles';

    @managed gridModel: GridModel;
    @managed appModel: AppModel;

    get records() {
        return this.gridModel.store.records;
    }

    constructor(appModel: AppModel) {
        super();
        makeObservable(this);

        this.gridModel = this.createGridModel();
        this.appModel = appModel;

        this.addReaction(
            {
                track: () => this.appModel.contacts,
                run: data => this.gridModel.loadData(data),
                fireImmediately: true
            },
            {
                track: () => this.gridModel.selectedRecord,
                run: rec => this.navigateToSelectedRecord(rec)
            },
            {
                track: () => XH.routerState,
                run: ({path}) => {
                    if (path === '/contactMobile') this.clearCurrentSelection();
                }
            }
        );
    }

    navigateToSelectedRecord(record) {
        if (!record) return;
        XH.appendRoute('details', {id: record.id});
    }

    toggleFavorite(id: string) {
        this.gridModel.store.modifyRecords({
            id,
            isFavorite: !this.gridModel.store.getById(id).data.isFavorite
        });
    }

    clearCurrentSelection() {
        this.gridModel.clearSelection();
    }

    @action
    setDisplayMode(value: 'grid' | 'tiles') {
        this.displayMode = value;

        XH.setPref(PERSIST_APP.prefKey, {
            ...(XH.getPref(PERSIST_APP.prefKey) ?? {}),
            displayMode: value
        });
    }

    //------------------------
    // Implementation
    //------------------------
    private createGridModel() {
        return new GridModel({
            emptyText: 'No matching contacts found.',
            selModel: 'single',
            groupBy: 'isFavorite',
            groupRowRenderer: ({value}) => (value === 'true' ? 'Favorites' : 'XH Engineers'),
            groupSortFn: (a, b) => (a < b ? 1 : -1),
            store: {
                fields: [
                    {name: 'isFavorite', type: 'bool'},
                    {name: 'profilePicture', type: 'string'}
                ]
            },
            columns: [
                {
                    field: {name: 'isFavorite', type: 'bool'}
                },
                {
                    ...nameCol,
                    width: null,
                    flex: 1
                },
                {
                    ...locationCol,
                    width: 150
                },
                {field: {name: 'email', type: 'string'}, hidden: true},
                {field: {name: 'bio', type: 'string'}, hidden: true},
                {field: {name: 'tags', type: 'tags'}, hidden: true},
                {field: {name: 'workPhone', type: 'string'}, hidden: true},
                {field: {name: 'cellPhone', type: 'string'}, hidden: true}
            ]
        });
    }
}
