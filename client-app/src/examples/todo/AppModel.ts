import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {TaskService} from './TaskService';

export const PERSIST_APP = {localStorageKey: 'todoAppState'};

export const App = {
    get model()             {return XH.appModel as AppModel},
    get oauthService()      {return XH.getService(OauthService)},
    get taskService()       {return XH.getService(TaskService)}
};

export class AppModel extends HoistAppModel {
    static instance: AppModel;

    static async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    override async initAsync() {
        await XH.installServicesAsync(TaskService);
    }

    override async logoutAsync() {
        await App.oauthService.logoutAsync();
    }
}