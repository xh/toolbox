import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {TaskService} from './TaskService';

export const PERSIST_APP = {localStorageKey: 'todoAppState'};

export class AppModel extends HoistAppModel {

    static async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    async initAsync() {
        await XH.installServicesAsync(TaskService);
    }

    async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

}

/**
 * @typedef XH
 * @property {TaskService} taskService
 * @property {OauthService} oauthService
 */