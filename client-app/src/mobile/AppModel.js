/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {XH, HoistAppModel, managed, refreshAllAsync} from '@xh/hoist/core';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import {AppMenuModel} from '@xh/hoist/mobile/cmp/header';
import {required} from '@xh/hoist/cmp/form';
import {select} from '@xh/hoist/mobile/cmp/input';

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
                title: 'Toolbox',
                content: HomePage
            },
            {
                id: 'grids',
                title: 'Grids',
                content: GridPage
            },
            {
                id: 'gridDetail',
                content: GridDetailPage
            },
            {
                id: 'treegrids',
                title: 'Tree Grids',
                content: TreeGridPage
            },
            {
                id: 'treeGridDetail',
                content: TreeGridDetailPage
            },
            {
                id: 'form',
                title: 'Form',
                content: FormPage
            },
            {
                id: 'containers',
                title: 'Containers',
                content: ContainersPage
            },
            {
                id: 'popups',
                title: 'Popups',
                content: PopupsPage
            },
            {
                id: 'icons',
                title: 'Icons',
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
            }
        ];
    }

    async initAsync() {
        await XH.installServicesAsync(PortfolioService);
    }

    async refreshAsync(isAutoRefresh) {
        await refreshAllAsync(
            [XH.portfolioService],
            isAutoRefresh
        );
    }
}