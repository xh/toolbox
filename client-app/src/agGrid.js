/**
 * Imports and Application License for ag-Grid.
 */
import '@ag-grid-enterprise/all-modules';
import {AllModules, LicenseManager, ModuleRegistry} from '@ag-grid-enterprise/all-modules';
import '@ag-grid-enterprise/all-modules/dist/styles/ag-grid.css';
import '@ag-grid-enterprise/all-modules/dist/styles/ag-theme-balham-dark.css';
import '@ag-grid-enterprise/all-modules/dist/styles/ag-theme-balham.css';

import {AgGridReact} from '@ag-grid-community/react';
import {Utils} from '@ag-grid-enterprise/all-modules';
import {version} from '@ag-grid-enterprise/all-modules/package.json';

import {installAgGridImpls} from '@xh/hoist/dynamics/agGrid';

ModuleRegistry.registerModules(AllModules);
LicenseManager.setLicenseKey(
    'CompanyName=Extremely Heavy Industries,LicensedApplication=Toolbox,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=6,LicensedProductionInstancesCount=1,AssetReference=AG-008400,ExpiryDate=4_June_2021_[v2]_MTYyMjc2MTIwMDAwMA==e5556393a62b122c439b49dfe11f26d9'
);

installAgGridImpls(AgGridReact, Utils, version);


