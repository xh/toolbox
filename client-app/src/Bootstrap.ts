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
import {ModuleRegistry} from '@ag-grid-community/core';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-balham.css';
import {AgGridReact} from '@ag-grid-community/react';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';

// Enterprise features
// IMPORTANT: If you are using enterprise version in your app, you must provide your own license
import {LicenseManager, EnterpriseCoreModule} from '@ag-grid-enterprise/core';
import {ClipboardModule} from '@ag-grid-enterprise/clipboard';
import {MenuModule} from '@ag-grid-enterprise/menu';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
// Fancy features for the raw agGrid Component example...
import {SideBarModule} from '@ag-grid-enterprise/side-bar';
import {ColumnsToolPanelModule} from '@ag-grid-enterprise/column-tool-panel';
import {FiltersToolPanelModule} from '@ag-grid-enterprise/filter-tool-panel';
// Feature for the portfolio sparklines example
import {SparklinesModule} from '@ag-grid-enterprise/sparklines';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ClipboardModule,
    MenuModule,
    RowGroupingModule,
    SideBarModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    SparklinesModule
]);

installAgGrid(AgGridReact, EnterpriseCoreModule.version);

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
