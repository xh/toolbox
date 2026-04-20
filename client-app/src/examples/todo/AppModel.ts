import {XH} from '@xh/hoist/core';
import {Span} from '@xh/hoist/utils/telemetry';
import {TaskService} from './TaskService';
import {BaseAppModel} from '../../BaseAppModel';

export const PERSIST_APP = {localStorageKey: 'todoAppState'};

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    override async initAsync(span: Span) {
        await super.initAsync(span);
        await XH.installServicesAsync([TaskService], span);
    }
}
