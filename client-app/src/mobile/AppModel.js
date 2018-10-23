/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {XH, HoistAppModel} from '@xh/hoist/core';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import {AppMenuModel} from '@xh/hoist/mobile/cmp/header';

import {homePage} from './home/HomePage';

@HoistAppModel
export class AppModel {

    navigatorModel = null;
    appMenuModel = null;

    constructor() {
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
        XH.track({msg: 'Loaded Mobile App'});
    }

    destroy() {
        XH.safeDestroy(this.appMenuModel);
        XH.safeDestroy(this.navigatorModel);
    }
}