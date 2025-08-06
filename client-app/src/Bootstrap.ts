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
//-----------------------------------------------------------------
import {installAgGrid} from '@xh/hoist/kit/ag-grid';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import {
    ModuleRegistry,
    provideGlobalGridOptions,
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    CellStyleModule,
    ColumnApiModule,
    PinnedRowModule,
    RenderApiModule,
    RowSelectionModule,
    RowApiModule,
    RowStyleModule,
    ScrollApiModule,
    TextEditorModule,
    TooltipModule,
    TextFilterModule
} from 'ag-grid-community';

import {AgChartsCommunityModule} from 'ag-charts-community';

ModuleRegistry.registerModules([
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    CellStyleModule,
    ColumnApiModule,
    PinnedRowModule,
    RenderApiModule,
    RowSelectionModule,
    RowApiModule,
    RowStyleModule,
    ScrollApiModule,
    TextEditorModule,
    TooltipModule,
    TextFilterModule
]);

// Enterprise features
// IMPORTANT: If you are using enterprise version in your app, you must provide your own license
import {
    LicenseManager,
    ClipboardModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    MenuModule,
    RowGroupingModule,
    SideBarModule,
    SparklinesModule,
    TreeDataModule
} from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ClipboardModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    MenuModule,
    RowGroupingModule,
    SideBarModule,
    SparklinesModule.with(AgChartsCommunityModule),
    TreeDataModule
]);

provideGlobalGridOptions({theme: 'legacy'});
installAgGrid(AgGridReact, ClientSideRowModelModule.version);

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
import highchartsExportData from 'highcharts/modules/export-data';
import highchartsExporting from 'highcharts/modules/exporting';
import highchartsHeatmap from 'highcharts/modules/heatmap';
import highchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import highchartsTree from 'highcharts/modules/treemap';
import highchartsTreeGraph from 'highcharts/modules/treegraph';

highchartsExportData(Highcharts);
highchartsExporting(Highcharts);
highchartsHeatmap(Highcharts);
highchartsOfflineExporting(Highcharts);
highchartsTree(Highcharts);
highchartsTreeGraph(Highcharts);

installHighcharts(Highcharts);
