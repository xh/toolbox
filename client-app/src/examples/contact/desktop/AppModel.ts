import {XH} from '@xh/hoist/core';
import {ContactService} from '../svc/ContactService';
import {BaseAppModel} from '../../../BaseAppModel';

export const PERSIST_APP = {prefKey: 'contactAppState'};

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(ContactService);
    }
}
