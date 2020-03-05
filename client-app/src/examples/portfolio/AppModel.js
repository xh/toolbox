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
import {PortfolioService} from '../../core/svc/PortfolioService';


@HoistAppModel
export class AppModel {

    get gridSizingMode() {
        return XH.getPref('gridSizingMode');
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

    async initAsync() {
        await XH.installServicesAsync(
            PortfolioService
        );
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
