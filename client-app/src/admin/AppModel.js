/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {XH} from '@xh/hoist/core';
import {AppModel as BaseAppModel} from '@xh/hoist/admin/AppModel';
import {Icon} from '@xh/hoist/icon';


import {WipTab} from './wip/WipTab';
import {TestsTab} from './tests/TestsTab';
import {PortfolioService} from '../core/svc/PortfolioService';

export class AppModel extends BaseAppModel {

    async initAsync() {
        await XH.installServicesAsync(PortfolioService);
    }

    //------------------------
    // Overrides
    //------------------------
    getTabRoutes() {
        return [
            ...super.getTabRoutes(),
            {
                name: 'tests',
                path: '/tests',
                children: [
                    {name: 'localDate', path: '/localDate'},
                    {name: 'grid', path: '/grid'},
                    {name: 'cube', path: '/cube'},
                    {name: 'webSockets', path: '/webSockets'},
                    {name: 'panelResizing', path: '/panelResizing'},
                    {name: 'fetchAPI', path: '/fetchAPI'},
                    {name: 'storeEditing', path: '/storeEditing'},
                    {name: 'select', path: '/select'},
                    {name: 'dataViewResizing', path: '/dataViewResizing'}
                ]
            },
            {
                name: 'wip',
                path: '/wip'
            }
        ];
    }

    createTabs() {
        return [
            ...super.createTabs(),
            {id: 'tests', icon: Icon.stopwatch(), content: TestsTab},
            {id: 'wip', title: 'WIP', icon: Icon.experiment(), content: WipTab}
        ];
    }
}