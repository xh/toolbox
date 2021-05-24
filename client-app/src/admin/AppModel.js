import {XH} from '@xh/hoist/core';
import {AppModel as BaseAppModel} from '@xh/hoist/admin/AppModel';
import {Icon} from '@xh/hoist/icon';
import {WipTab} from './wip/WipTab';
import {TestsTab} from './tests/TestsTab';
import {roadmapTab} from './roadmap/RoadmapTab';
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
                name: 'roadmap',
                path: '/roadmap',
                children: [
                    {name: 'projects', path: '/projects'},
                    {name: 'phases', path: '/phases'}
                ]
            },
            {
                name: 'tests',
                path: '/tests',
                children: [
                    {name: 'asyncLoop', path: '/asyncLoop'},
                    {name: 'cube', path: '/cube'},
                    {name: 'dataView', path: '/dataView'},
                    {name: 'fetchAPI', path: '/fetchAPI'},
                    {name: 'grid', path: '/grid'},
                    {name: 'localDate', path: '/localDate'},
                    {name: 'panelResizing', path: '/panelResizing'},
                    {name: 'select', path: '/select'},
                    {name: 'storeEditing', path: '/storeEditing'},
                    {name: 'webSockets', path: '/webSockets'},
                    {name: 'columnFilters', path: '/columnFilters'}
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
            {id: 'roadmap', title: 'Roadmap', icon: Icon.mapSigns(), content: roadmapTab},
            {id: 'tests', icon: Icon.stopwatch(), content: TestsTab},
            {id: 'wip', title: 'WIP', icon: Icon.experiment(), content: WipTab}
        ];
    }
}
