import {XH} from '@xh/hoist/core';
import {Span} from '@xh/hoist/utils/telemetry';
import {ContactService} from './svc/ContactService';
import {BaseAppModel} from '../../BaseAppModel';

export const PERSIST_APP = {prefKey: 'contactAppState'};

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    override async initAsync(span: Span) {
        await super.initAsync(span);
        await XH.installServicesAsync([ContactService], span);
    }
}
