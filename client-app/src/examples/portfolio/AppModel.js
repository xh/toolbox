/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {HoistAppModel, XH} from '@xh/hoist/core';
import {PortfolioService} from '../../core/svc/PortfolioService';

@HoistAppModel
export class AppModel {

    get useCompactGrids() {
        return XH.getPref('defaultGridMode') == 'COMPACT';
    }

    async initAsync() {
        await XH.installServicesAsync(
            PortfolioService
        );
    }
}
