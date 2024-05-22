import {XH} from '@xh/hoist/core';
import {TaskService} from './TaskService';
import {BaseAppModel} from '../../BaseAppModel';

export const PERSIST_APP = {localStorageKey: 'todoAppState'};

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(TaskService);
    }
}
