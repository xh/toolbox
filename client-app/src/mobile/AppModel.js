/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {XH, HoistAppModel, managed, loadAllAsync} from '@xh/hoist/core';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import {AppMenuModel} from '@xh/hoist/mobile/cmp/header';
import {required} from '@xh/hoist/cmp/form';
import {select, switchInput} from '@xh/hoist/mobile/cmp/input';

import {PortfolioService} from '../core/svc/PortfolioService';

import {HomePage} from './home/HomePage';
import {GridPage} from './grids/GridPage';
import {GridDetailPage} from './grids/GridDetailPage';
import {TreeGridPage} from './treegrids/TreeGridPage';
import {TreeGridDetailPage} from './treegrids/TreeGridDetailPage';
import {FormPage} from './form/FormPage';
import {ContainersPage} from './containers/ContainersPage';
import {PopupsPage} from './popups/PopupsPage';
import {IconPage} from './icons/IconPage';

@HoistAppModel
export class AppModel {

    @managed
    appMenuModel = new AppMenuModel();

    @managed
    navigatorModel = new NavigatorModel({
        routes: [
            {
                id: 'default',
                content: HomePage
            },
            {
                id: 'grids',
                content: GridPage
            },
            {
                id: 'gridDetail',
                content: GridDetailPage
            },
            {
                id: 'treegrids',
                content: TreeGridPage
            },
            {
                id: 'treeGridDetail',
                content: TreeGridDetailPage
            },
            {
                id: 'form',
                content: FormPage
            },
            {
                id: 'containers',
                content: ContainersPage
            },
            {
                id: 'popups',
                content: PopupsPage
            },
            {
                id: 'icons',
                content: IconPage
            }
        ]
    });

    getRoutes() {
        return [
            {
                name: 'default',
                path: '/mobile',
                children: [
                    {
                        name: 'grids',
                        path: '/grids',
                        children: [{
                            name: 'gridDetail',
                            path: '/:id<\\d+>'
                        }]
                    },
                    {
                        name: 'treegrids',
                        path: '/treegrids',
                        children: [{
                            name: 'treeGridDetail',
                            path: '/:id'
                        }]
                    },
                    {
                        name: 'form',
                        path: '/form'
                    },
                    {
                        name: 'containers',
                        path: '/containers'
                    },
                    {
                        name: 'popups',
                        path: '/popups'
                    },
                    {
                        name: 'icons',
                        path: '/icons'
                    }
                ]
            }
        ];
    }

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
            },
            {
                name: 'autoRefresh',
                prefName: 'xhAutoRefreshEnabled',
                formField: {
                    label: 'Auto-refresh',
                    info: `Enable to auto-refresh app data every ${XH.autoRefreshService.interval} seconds`,
                    item: switchInput()
                }
            }
        ];
    }

    async initAsync() {
        await XH.installServicesAsync(PortfolioService);
    }

    async doLoadAsync(loadSpec) {
        await loadAllAsync([], loadSpec);
    }
}