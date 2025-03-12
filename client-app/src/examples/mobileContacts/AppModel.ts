import {XH} from '@xh/hoist/core';

// No change in contact service. Pull from the desktop version to avoid redundancy
import {ContactService} from '../../examples/contact/svc/ContactService';
import {BaseAppModel} from '../../BaseAppModel';

export const PERSIST_APP = {prefKey: 'contactAppState'};

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(ContactService);
    }
}
