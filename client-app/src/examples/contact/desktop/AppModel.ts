import {XH} from '@xh/hoist/core';
import {ContactService} from '../svc/ContactService';
import {BaseAppModel} from '../../../BaseAppModel';

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(ContactService);
    }
}
