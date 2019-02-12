/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {XH, HoistAppModel, managed} from '@xh/hoist/core';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import {AppMenuModel} from '@xh/hoist/mobile/cmp/header';
import {required} from '@xh/hoist/cmp/form';
import {select} from '@xh/hoist/mobile/cmp/input';

import {PortfolioService} from '../core/svc/PortfolioService';
import {homePage} from './home/HomePage';

@HoistAppModel
export class AppModel {

    @managed
    appMenuModel = new AppMenuModel();

    @managed
    navigatorModel = new NavigatorModel({
        pageFactory: homePage,
        title: 'Toolbox'
    });

    getAppOptions() {
        return [
            {
                name: 'theme',
                formField: {
                    item: select({
                        options: [
                            {value: 'light', label: 'Light'},
                            {value: 'dark', label: 'Dark'}
                        ]
                    })
                },
                fieldModel: {
                    rules: [required]
                },
                valueGetter: () => XH.darkTheme ? 'dark' : 'light',
                valueSetter: (v) => XH.acm.themeModel.setDarkTheme(v == 'dark')
            }
        ];
    }

    navigate(title, pageFactory, pageProps) {
        this.navigatorModel.pushPage({title, pageFactory, pageProps});
    }

    async initAsync() {
        await XH.installServicesAsync(PortfolioService);
    }
}