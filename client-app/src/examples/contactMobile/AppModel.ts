import {XH} from '@xh/hoist/core';

// No change in contact service. Pull from the desktop version to avoid redundancy
import {ContactService} from '../contact/svc/ContactService';
import {BaseAppModel} from '../../BaseAppModel';

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(ContactService);
    }
}
