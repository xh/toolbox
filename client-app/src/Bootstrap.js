/**
 * Bootstrap File.
 *
 * This file is imported by each of the client apps, and runs shared code.
 */

import {installAgGrid} from '@xh/hoist/kit/ag-grid';
import {installHighcharts} from '@xh/hoist/kit/highcharts';

//-----------------------------------------------------------------
// ag-Grid -- Import and Register
// If you are using enterprise version, you must provide a license
//-----------------------------------------------------------------
// Community edition.
// import {AllCommunityModules, ModuleRegistry} from '@ag-grid-community/all-modules';
// import '@ag-grid-community/all-modules/dist/styles/ag-grid.css';
// import '@ag-grid-community/all-modules/dist/styles/ag-theme-balham-dark.css';
// import '@ag-grid-community/all-modules/dist/styles/ag-theme-balham.css';
// import {AgGridReact} from '@ag-grid-community/react';
// import {version} from '@ag-grid-community/all-modules/package.json';
// ModuleRegistry.registerModules(AllCommunityModules);
// installAgGridImpls(AgGridReact, version);

// Enterprise edition (w/license for Toolbox).
import {AllModules, LicenseManager, ModuleRegistry} from '@ag-grid-enterprise/all-modules';
import '@ag-grid-enterprise/all-modules/dist/styles/ag-grid.css';
import '@ag-grid-enterprise/all-modules/dist/styles/ag-theme-balham-dark.css';
import '@ag-grid-enterprise/all-modules/dist/styles/ag-theme-balham.css';
import {AgGridReact} from '@ag-grid-community/react';
import agPkg from '@ag-grid-enterprise/all-modules/package.json';
ModuleRegistry.registerModules(AllModules);
LicenseManager.setLicenseKey(
    'CompanyName=Extremely Heavy Industries,LicensedApplication=Toolbox,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=6,LicensedProductionInstancesCount=1,AssetReference=AG-015460,ExpiryDate=4_June_2022_[v2]_MTY1NDI5NzIwMDAwMA==3a9d403fad7ddc79992a374430df523f'
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

