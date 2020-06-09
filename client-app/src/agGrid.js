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
LicenseManager.setLicenseKey(xhAgGridLicenseKey); // See webpack.DefinePlugin in @xh/hoist-dev-utils/configureWebpack

installAgGridImpls(AgGridReact, Utils, version);


