/**
 * Bootstrap File.
 *
 * This file is imported by each of the client apps, and runs shared code.
 */

//-----------------------------------------------------------------
// App Services -- Import and Register
//-----------------------------------------------------------------
import {ContactService} from "./examples/contact/svc/ContactService";
import {GitHubService} from './core/svc/GitHubService';
import {PortfolioService} from './core/svc/PortfolioService';
import {OauthService} from './core/svc/OauthService';
import {TaskService} from "./examples/todo/TaskService";

declare module '@xh/hoist/core' {
    export interface XhApi {
        contactService: ContactService
        gitHubService: GitHubService,
        oauthService: OauthService,
        portfolioService: PortfolioService,
        taskService: TaskService
    }
}

import {installAgGrid} from '@xh/hoist/kit/ag-grid';
import {installHighcharts} from '@xh/hoist/kit/highcharts';

//-----------------------------------------------------------------
// ag-Grid -- Import and Register
//-----------------------------------------------------------------
import {ModuleRegistry} from '@ag-grid-community/core';
import '@ag-grid-community/core/dist/styles/ag-grid.css';
import '@ag-grid-community/core/dist/styles/ag-theme-balham-dark.css';
import '@ag-grid-community/core/dist/styles/ag-theme-balham.css';
import {AgGridReact} from '@ag-grid-community/react';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import agPkg from '@ag-grid-community/core/package.json';

// Enterprise features
// IMPORTANT: If you are using enterprise version in your app, you must provide your own license
import {LicenseManager} from '@ag-grid-enterprise/core';
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
LicenseManager.setLicenseKey(
    'CompanyName=Extremely Heavy Industries Inc.,LicensedApplication=Toolbox,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=6,LicensedProductionInstancesCount=1,AssetReference=AG-027581,ExpiryDate=4_June_2023_[v2]_MTY4NTgzMzIwMDAwMA==d4c6cb75d5bcb4ef4cbee5c6fee57351'
);
installAgGrid(AgGridReact, agPkg.version);


//-------------------------------------------------------------------------------
// Highcharts - Import and Register
// You must provide a license for any features (e.g. highstock) that require it
//-------------------------------------------------------------------------------
import Highcharts from 'highcharts/highstock';
import highchartsExportData from 'highcharts/modules/export-data';
import highchartsExporting from 'highcharts/modules/exporting';
import highchartsHeatmap from 'highcharts/modules/heatmap';
import highchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import highchartsTree from 'highcharts/modules/treemap';

highchartsExporting(Highcharts);
highchartsOfflineExporting(Highcharts);
highchartsExportData(Highcharts);
highchartsTree(Highcharts);
highchartsHeatmap(Highcharts);

installHighcharts(Highcharts);

