import {XH} from '@xh/hoist/core';
import {DocService} from './DocService';
import {BaseAppModel} from '../../BaseAppModel';

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(DocService);
    }
}
