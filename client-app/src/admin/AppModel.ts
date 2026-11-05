import {AppModel as HoistAdminAppModel} from '@xh/hoist/admin/AppModel';
import type {TabConfig, TabSwitcherConfig} from '@xh/hoist/cmp/tab';
import type {InitContext} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {PortfolioService} from '../core/svc/PortfolioService';
import {viewManagers} from './viewManagers';
import {CubeTestPanel} from './tests/cube/CubeTestPanel';
import {EmailTestPanel} from './tests/email/EmailTestPanel';
import {FetchApiTestPanel} from './tests/fetch/FetchApiTestPanel';
import {GridTestPanel} from './tests/grids/GridTestPanel';
import {LocalDateTestPanel} from './tests/localDate/LocalDateTestPanel';
import {PanelResizingTestPanel} from './tests/panels/PanelResizingTestPanel';
import {SelectTestPanel} from './tests/select/SelectTestPanel';
import {WebSocketTestPanel} from './tests/websocket/WebSocketTestPanel';
import {asyncLoopPanel} from './tests/asyncLoops/AsyncLoopPanel';
import {columnChooserTestPanel} from './tests/columnChooser/ColumnChooserTestPanel';
import {dataViewTestPanel} from './tests/dataview/DataViewTestPanel';
import {formatterParityPanel} from './tests/gridFormatterParity/FormatterParityPanel';
import {gridScrolling} from './tests/gridScrolling/GridScrolling';
import {storeColumnFilterPanel} from './tests/columnFilters/store/StoreColumnFilterPanel';
import {viewColumnFilterPanel} from './tests/columnFilters/view/ViewColumnFilterPanel';
import {viewManagerTestPanel} from './tests/viewmanager/ViewManagerTestPanel';
import {CubeGridTestPanel} from './tests/cubegrid/CubeGridTestPanel';
import {CubePivotPerfPanel} from './tests/cubegrid/CubePivotPerfPanel';
import {PivotInspectPanel} from './tests/cubegrid/PivotInspectPanel';
import {PivotViewTestPanel} from './tests/cubegrid/PivotViewTestPanel';

export class AppModel extends HoistAdminAppModel {
    static instance: AppModel;

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);
        await XH.installServicesAsync([PortfolioService], ctx);

        // Awaited here, in initAsync, so that all saved configs are loaded and the desired one
        // preselected before GridTestModel binds its settings within its constructor.
        await viewManagers.initAsync(ctx);
    }

    //------------------------
    // Overrides
    //------------------------
    override getTabRoutes() {
        return [
            ...super.getTabRoutes(),
            {
                name: 'tests',
                path: '/tests',
                children: [
                    {name: 'grid', path: '/grid'},
                    {name: 'dataView', path: '/dataView'},
                    {name: 'gridScrolling', path: '/gridScrolling'},
                    {name: 'gridFormatterParity', path: '/gridFormatterParity'},
                    {name: 'storeColumnFilters', path: '/storeColumnFilters'},
                    {name: 'viewColumnFilters', path: '/viewColumnFilters'},
                    {name: 'columnChooser', path: '/columnChooser'},
                    {name: 'cubeGrid', path: '/cubeGrid'},
                    {name: 'cube', path: '/cube'},
                    {name: 'cubePivotPerf', path: '/cubePivotPerf'},
                    {name: 'pivotView', path: '/pivotView'},
                    {name: 'pivotInspect', path: '/pivotInspect'},
                    {name: 'email', path: '/email'},
                    {name: 'fetchAPI', path: '/fetchAPI'},
                    {name: 'webSockets', path: '/webSockets'},
                    {name: 'asyncLoop', path: '/asyncLoop'},
                    {name: 'localDate', path: '/localDate'},
                    {name: 'panelResizing', path: '/panelResizing'},
                    {name: 'select', path: '/select'},
                    {name: 'viewManager', path: '/viewManager'}
                ]
            }
        ];
    }

    override createTabs() {
        // Each group renders under a header in the vertical switcher.
        const serviceTabs: TabConfig[] = [
            {id: 'email', title: 'Email', content: EmailTestPanel},
            {id: 'fetchAPI', title: 'Fetch API', content: FetchApiTestPanel},
            {id: 'webSockets', title: 'WebSockets', content: WebSocketTestPanel}
        ].map(it => ({...it, group: 'services'}));
        const gridTabs: TabConfig[] = [
            {id: 'grid', title: 'Grid', content: GridTestPanel},
            {id: 'dataView', title: 'DataView', content: dataViewTestPanel},
            {id: 'gridScrolling', content: gridScrolling},
            {id: 'gridFormatterParity', content: formatterParityPanel},
            {id: 'storeColumnFilters', content: storeColumnFilterPanel},
            {id: 'viewColumnFilters', content: viewColumnFilterPanel},
            {id: 'columnChooser', title: 'Column Chooser', content: columnChooserTestPanel}
        ].map(it => ({...it, group: 'grid'}));
        const cubeTabs: TabConfig[] = [
            {id: 'cubeGrid', title: 'CubeGrid', content: CubeGridTestPanel},
            {id: 'cube', title: 'Cube Perf', content: CubeTestPanel},
            {id: 'cubePivotPerf', title: 'Cube Pivot Perf', content: CubePivotPerfPanel},
            {id: 'pivotView', title: 'Pivot View', content: PivotViewTestPanel},
            {id: 'pivotInspect', title: 'Pivot Inspect', content: PivotInspectPanel}
        ].map(it => ({...it, group: 'cube'}));
        const otherTabs: TabConfig[] = [
            {id: 'asyncLoop', title: 'Async Loops', content: asyncLoopPanel},
            {id: 'localDate', title: 'LocalDate API', content: LocalDateTestPanel},
            {id: 'panelResizing', content: PanelResizingTestPanel},
            {id: 'select', content: SelectTestPanel},
            {id: 'viewManager', content: viewManagerTestPanel}
        ].map(it => ({...it, group: 'other'}));
        const switcher: TabSwitcherConfig = {
            mode: 'static',
            groups: [
                {key: 'grid', title: 'Grid'},
                {key: 'cube', title: 'Cube/CubeGrid'},
                {key: 'services', title: 'Services'},
                {key: 'other', title: 'Other'}
            ]
        };
        return [
            ...super.createTabs(),
            {
                id: 'tests',
                icon: Icon.stopwatch(),
                content: {
                    switcher,
                    tabs: [...gridTabs, ...cubeTabs, ...serviceTabs, ...otherTabs]
                }
            }
        ] as TabConfig[];
    }
}
