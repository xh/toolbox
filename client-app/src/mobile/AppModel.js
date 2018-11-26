/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {XH, HoistAppModel} from '@xh/hoist/core';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import {AppMenuModel} from '@xh/hoist/mobile/cmp/header';
import {PortfolioService} from '../core/svc/PortfolioService';
import {DimMenuModel} from '@xh/hoist/mobile/cmp/dimChooser';


import {homePage} from './home/HomePage';

@HoistAppModel
export class AppModel {

    navigatorModel = null;
    appMenuModel = null;
    dimMenuModel = null;

    constructor() {
        // this.dimMenuModel = new DimMenuModel({
        //     xPos: 50,
        //     yPos: 400,
        // });
        this.appMenuModel = new AppMenuModel();
        this.navigatorModel = new NavigatorModel({
            pageFactory: homePage,
            title: 'Toolbox'
        });
    }

    navigate(title, pageFactory) {
        this.navigatorModel.pushPage({title, pageFactory});
    }

    async initAsync() {
        await XH.installServicesAsync(PortfolioService);
    }

    destroy() {
        XH.safeDestroy(this.appMenuModel);
        XH.safeDestroy(this.navigatorModel);
    }
}