import {managed, PlainObject, XH} from '@xh/hoist/core';
import {ContactService} from '../svc/ContactService';
import {BaseAppModel} from '../../../BaseAppModel';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import directoryPanel from './DirectoryPanel';
import detailsPanel from './details/DetailsPanel';
import DetailsPanelModel from './details/DetailsPanelModel';
import DirectoryPanelModel from './DirectoryPanelModel';
import {action, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {castArray, isEmpty, uniq} from 'lodash';

import {
    autoRefreshAppOption,
    sizingModeAppOption,
    themeAppOption
} from '@xh/hoist/mobile/cmp/appOption';

export default class AppModel extends BaseAppModel {
    static instance: AppModel;

    @observable.ref tagList: string[] = [];
    @observable.ref contacts: PlainObject[] = [];

    @managed directoryPanelModel: DirectoryPanelModel;
    @managed detailsPanelModel: DetailsPanelModel;

    @managed
    navigatorModel: NavigatorModel = new NavigatorModel({
        track: true,
        pages: [
            {id: 'default', content: directoryPanel},
            {id: 'details', content: detailsPanel}
        ]
    });

    override getRoutes() {
        return [
            {
                name: 'default',
                path: '/contactMobile',
                children: [
                    {
                        name: 'details',
                        path: '/:id'
                    }
                ]
            }
        ];
    }

    constructor() {
        super();
        makeObservable(this);
        this.directoryPanelModel = new DirectoryPanelModel(this);
        this.detailsPanelModel = new DetailsPanelModel(this);
    }

    async updateContactAsync(id: string, data: PlainObject) {
        if (!data || isEmpty(data)) return;
        // Mobile select only allows single selections, while desktop allows multiple
        // This means we receive an array on the desktop picker, and a single value here.
        // Convert single result into an array of one to keep data consistent.
        if (data.tags) {
            data.tags = castArray(data.tags);
        }
        await XH.contactService.updateContactAsync(id, data);
        await this.refreshAsync();
    }

    @action
    async toggleFavorite(id: string) {
        await XH.contactService.toggleFavorite(id);
        this.contacts = this.contacts.map(contact =>
            contact.id === id ? {...contact, isFavorite: !contact.isFavorite} : contact
        );
    }

    override getAppOptions() {
        return [themeAppOption(), sizingModeAppOption(), autoRefreshAppOption()];
    }

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(ContactService);
        await this.loadAsync();
    }

    override async doLoadAsync() {
        try {
            const contacts = await XH.contactService.getContactsAsync();
            runInAction(() => {
                this.contacts = contacts;
                this.tagList = uniq(contacts.flatMap(it => it.tags ?? [])).sort() as string[];
            });
        } catch (e) {
            XH.handleException(e);
        }
    }
}
