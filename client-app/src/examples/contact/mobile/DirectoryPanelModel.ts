import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {bindable, makeObservable, action} from '@xh/hoist/mobx';
import {GridModel} from '@xh/hoist/cmp/grid';
import {div, hbox} from '@xh/hoist/cmp/layout';
import {nameCol, locationCol} from '../../../core/columns';
import {isEmpty, uniq} from 'lodash';

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

    clearCurrentSelection() {
        this.gridModel.clearSelection();
    }

    @action
    private toggleTag(tag: string) {
        const tagList = this.appModel.tagList ?? [];
        this.appModel.tagList = tagList.includes(tag)
            ? uniq(tagList.filter(t => t !== tag))
            : [...tagList, tag];
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
                    {name: 'profilePicture', type: 'string'},
                    {name: 'bio', type: 'string'},
                    {name: 'tags', type: 'auto'}
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
                {
                    field: 'tags',
                    width: 400,
                    renderer: this.tagsRenderer
                },
                {field: {name: 'workPhone', type: 'string'}, hidden: true},
                {field: {name: 'cellPhone', type: 'string'}, hidden: true}
            ]
        });
    }

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
