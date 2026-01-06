/**
 * Bootstrap routine for registering common client-side licenses and other low-level library setup.
 * Common routines to go in this file include:
 *  - TypeScript module augmentation
 *  - AG Grid license registration and feature registration.
 *  - Highcharts feature registration.
 */

//-----------------------------------------------------------------
// App Services -- Import and Register
//-----------------------------------------------------------------
import {XH} from '@xh/hoist/core';
import {when} from '@xh/hoist/mobx';

import {ContactService} from './examples/contact/svc/ContactService';
import {GitHubService} from './core/svc/GitHubService';
import {PortfolioService} from './core/svc/PortfolioService';
import {TaskService} from './examples/todo/TaskService';

declare module '@xh/hoist/core' {
    // Merge interface with XHApi class to include injected services.
    export interface XHApi {
        contactService: ContactService;
        gitHubService: GitHubService;
        portfolioService: PortfolioService;
        taskService: TaskService;
    }

    export interface HoistUser {
        profilePicUrl: string;
    }
}

//-----------------------------------------------------------------
// ag-Grid -- Import and Register
//
// IMPORTANT: If you are using enterprise version in your app
// you must provide your own license
//-----------------------------------------------------------------
import {installAgGrid} from '@xh/hoist/kit/ag-grid';
import {ModuleRegistry, provideGlobalGridOptions} from 'ag-grid-community';
import {LicenseManager} from 'ag-grid-enterprise';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';

// 1) Standard community modules - required for all Hoist Apps.
import {
    CellStyleModule,
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    ColumnApiModule,
    CustomEditorModule,
    PinnedRowModule,
    RenderApiModule,
    RowApiModule,
    RowAutoHeightModule,
    RowSelectionModule,
    RowStyleModule,
    ScrollApiModule,
    TextEditorModule,
    TextFilterModule,
    TooltipModule
} from 'ag-grid-community';
ModuleRegistry.registerModules([
    CellStyleModule,
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    ColumnApiModule,
    CustomEditorModule,
    PinnedRowModule,
    RenderApiModule,
    RowApiModule,
    RowAutoHeightModule,
    RowSelectionModule,
    RowStyleModule,
    ScrollApiModule,
    TextEditorModule,
    TextFilterModule,
    TooltipModule
]);

// 2) Typical enterprise modules - useful for most apps.
import {
    CellSelectionModule,
    ClipboardModule,
    MenuModule,
    RowGroupingModule,
    TreeDataModule
} from 'ag-grid-enterprise';
ModuleRegistry.registerModules([
    CellSelectionModule,
    ClipboardModule,
    MenuModule,
    RowGroupingModule,
    TreeDataModule
]);

// 3) Toolbox specific modules - for "direct" AG Grid usage demo, not typically required.
import {
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    PivotModule,
    SideBarModule,
    SparklinesModule
} from 'ag-grid-enterprise';
import {NumberFilterModule} from 'ag-grid-community';
import {AgChartsCommunityModule} from 'ag-charts-community';
ModuleRegistry.registerModules([
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    NumberFilterModule,
    PivotModule,
    SideBarModule,
    SparklinesModule.with(AgChartsCommunityModule),
    TextFilterModule
]);

provideGlobalGridOptions({theme: 'legacy'});
installAgGrid(AgGridReact as any, ClientSideRowModelModule.version);

when(
    () => XH.appIsRunning,
    () => {
        const agLicense = XH.getConf('jsLicenses').agGrid;
        if (agLicense) LicenseManager.setLicenseKey(agLicense);
    }
);

//-------------------------------------------------------------------------------
// Highcharts - Import and Register
// You must provide a license for any features (e.g. highstock) that require it
//-------------------------------------------------------------------------------
import {installHighcharts} from '@xh/hoist/kit/highcharts';
import Highcharts from 'highcharts/highstock';

// Check https://api.highcharts.com/highcharts/ for modules that require other base modules and import in order
import 'highcharts/modules/exporting';
import 'highcharts/modules/heatmap';
import 'highcharts/modules/treemap';

// `treegraph` must be imported after `treemap`
import 'highcharts/modules/treegraph';

// `export-data` + `offline-exporting` must be imported after `exporting`
import 'highcharts/modules/export-data';
import 'highcharts/modules/offline-exporting';

installHighcharts(Highcharts);
