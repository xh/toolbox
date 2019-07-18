/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {HoistAppModel, loadAllAsync, XH} from '@xh/hoist/core';

import {CompanyService} from '../../core/svc/CompanyService';
import {PortfolioService} from '../../core/svc/PortfolioService';
import {SalesService} from '../../core/svc/SalesService';
import {TradeService} from '../../core/svc/TradeService';


@HoistAppModel
export class AppModel {


    get useCompactGrids() {
        return XH.getPref('defaultGridMode') == 'COMPACT';
    }

    async initAsync() {
        await XH.installServicesAsync(
            CompanyService,
            TradeService,
            SalesService,
            PortfolioService
        );
    }

    async doLoadAsync(loadSpec) {
        await loadAllAsync([], loadSpec);
    }
}
