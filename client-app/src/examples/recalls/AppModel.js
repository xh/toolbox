/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2020 Extremely Heavy Industries Inc.
 */
import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';

export const PERSIST_APP = {localStorageKey: 'recallsAppState'};

export class AppModel extends HoistAppModel {

    get gridSizingMode() {
        return XH.getPref('gridSizingMode');
    }

    async preAuthInitAsync() {
        await XH.installServicesAsync(OauthService);
    }

    async initAsync() {}

    async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

}
