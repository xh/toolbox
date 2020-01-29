/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {HoistAppModel, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {PortfolioService} from '../../core/svc/PortfolioService';


@HoistAppModel
export class AppModel {

    get gridSizingMode() {
        return XH.getPref('defaultGridMode');
    }

    getAppOptions() {
        return [
            {
                name: 'defaultGridMode',
                prefName: 'defaultGridMode',
                formField: {
                    label: 'Default grid size',
                    item: buttonGroupInput(
                        button({value: 'STANDARD', text: 'Standard', icon: Icon.gridLarge()}),
                        button({value: 'COMPACT', text: 'Compact', icon: Icon.grid()})
                    )
                },
                reloadRequired: true
            }
        ];
    }

    async initAsync() {
        await XH.installServicesAsync(
            PortfolioService
        );
    }
}
