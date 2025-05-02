import {AppModel as HoistAdminAppModel} from '@xh/hoist/admin/AppModel';
import {XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {PortfolioService} from '../core/svc/PortfolioService';
import {roadmapTab} from './roadmap/RoadmapTab';
import {testsTab} from './tests/TestsTab';

export class AppModel extends HoistAdminAppModel {
    static instance: AppModel;

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(PortfolioService);
        XH.fetchService.autoGenCorrelationIds = true;
    }

    //------------------------
    // Overrides
    //------------------------
    override getTabRoutes() {
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
                    {name: 'gridScrolling', path: '/gridScrolling'},
                    {name: 'localDate', path: '/localDate'},
                    {name: 'panelResizing', path: '/panelResizing'},
                    {name: 'select', path: '/select'},
                    {name: 'storeColumnFilters', path: '/storeColumnFilters'},
                    {name: 'viewColumnFilters', path: '/viewColumnFilters'},
                    {name: 'viewManager', path: '/viewManager'},
                    {name: 'webSockets', path: '/webSockets'}
                ]
            }
        ];
    }

    override createTabs() {
        return [
            ...super.createTabs(),
            {id: 'roadmap', title: 'Roadmap', icon: Icon.mapSigns(), content: roadmapTab},
            {id: 'tests', icon: Icon.stopwatch(), content: testsTab}
        ];
    }
}
