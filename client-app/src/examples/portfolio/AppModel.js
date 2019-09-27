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
import {bindable} from '@xh/hoist/mobx';
import {PortfolioService} from '../../core/svc/PortfolioService';


@HoistAppModel
export class AppModel {

    @bindable renderMode = 'factories';

    get useCompactGrids() {
        return XH.getPref('defaultGridMode') == 'COMPACT';
    }

    getAppOptions() {
        return [
            {
                name: 'renderMode',
                formField: {
                    item: buttonGroupInput(
                        button({value: 'jsx', text: 'JSX', icon: Icon.code()}),
                        button({value: 'factories', text: 'Factories', icon: Icon.factory()})
                    )
                },
                valueGetter: () => this.renderMode,
                valueSetter: (v) => this.setRenderMode(v)
            },
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
