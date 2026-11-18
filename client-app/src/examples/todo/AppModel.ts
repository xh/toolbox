import type {InitContext} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {TaskService} from './TaskService';
import {BaseAppModel} from '../../BaseAppModel';

export const PERSIST_APP = {localStorageKey: 'todoAppState'};

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);
        await XH.installServicesAsync([TaskService], ctx);
    }
}
