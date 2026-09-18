import type {InitContext} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {ContactService} from './svc/ContactService';
import {BaseAppModel} from '../../BaseAppModel';

export const PERSIST_APP = {prefKey: 'contactAppState'};

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);
        await XH.installServicesAsync([ContactService], ctx);
    }
}
