/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2020 Extremely Heavy Industries Inc.
 */
import {HoistAppModel, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {startCase} from 'lodash';
import {OauthService} from '../../core/svc/OauthService';
import {PortfolioService} from '../../core/svc/PortfolioService';

export const PERSIST_MAIN = {localStorageKey: 'portfolioAppMainState'};
export const PERSIST_DETAIL = {localStorageKey: 'portfolioAppDetailState'};

export class AppModel extends HoistAppModel {

    get gridSizingMode() {
        return XH.getPref('gridSizingMode');
    }

    async preAuthInitAsync() {
        await XH.installServicesAsync(OauthService);
    }

    async initAsync() {
        await XH.installServicesAsync(
            PortfolioService
        );
    }

    async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

    getAppOptions() {
        return [
            {
                name: 'gridSizingMode',
                prefName: 'gridSizingMode',
                formField: {
                    label: 'Default grid size',
                    item: buttonGroupInput(
                        getGridSizeModeButton('large'),
                        getGridSizeModeButton('standard'),
                        getGridSizeModeButton('compact'),
                        getGridSizeModeButton('tiny')
                    )
                },
                reloadRequired: true
            }
        ];
    }

}


function getGridSizeModeButton(size) {
    return button({
        value: size,
        text: startCase(size),
        style: {
            fontSize: `var(--xh-grid-${size}-font-size-px`
        }
    });
}
