import {HoistAppModel, initServicesAsync} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {TaskService} from './TaskService';

export const PERSIST_APP = {localStorageKey: 'todoAppState'};

export class AppModel extends HoistAppModel {

    static oauthService: OauthService;
    taskService: TaskService;

    static async preAuthAsync() {
        await initServicesAsync(OauthService, this);
    }

    override async initAsync() {
        await this.initServicesAsync(TaskService);
    }

    override async logoutAsync() {
        await AppModel.oauthService.logoutAsync();
    }
}