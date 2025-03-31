import {managed, PlainObject, XH} from '@xh/hoist/core';
import {ContactService} from '../svc/ContactService';
import {BaseAppModel} from '../../../BaseAppModel';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import directoryPanel from './DirectoryPanel';
import detailsPanel from './details/DetailsPanel';
import DetailsPanelModel from './details/DetailsPanelModel';
import DirectoryPanelModel from './DirectoryPanelModel';
import {observable, runInAction} from '@xh/hoist/mobx';
import {uniq} from 'lodash';

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
        this.directoryPanelModel = new DirectoryPanelModel(this);
        this.detailsPanelModel = new DetailsPanelModel(this);
    }

    setCurrentRecord(contact: PlainObject) {
        this.detailsPanelModel.setCurrentRecord(contact);
    }

    async updateContactAsync(id: string, data: PlainObject) {
        await XH.contactService.updateContactAsync(id, data);
        this.directoryPanelModel.updateContact(id, data);
    }

    async toggleFavorite(id: string) {
        await XH.contactService.toggleFavorite(id);
        this.directoryPanelModel.toggleFavorite(id);
    }

    override getAppOptions() {
        return [themeAppOption(), sizingModeAppOption(), autoRefreshAppOption()];
    }

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(ContactService);
        this.loadAsync();
    }

    override async doLoadAsync() {
        try {
            this.contacts = await XH.contactService.getContactsAsync();

            runInAction(() => {
                this.tagList = uniq(this.contacts.flatMap(it => it.tags ?? [])).sort() as string[];
            });
            this.directoryPanelModel.loadAsync();
        } catch (e) {
            XH.handleException(e);
        }
    }
}
