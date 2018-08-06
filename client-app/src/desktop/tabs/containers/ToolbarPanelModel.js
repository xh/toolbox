/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {HoistModel} from '@xh/hoist/core/index';
import {action, observable} from '@xh/hoist/mobx/index';

@HoistModel()
export class ToolbarPanelModel {
    @observable state = null;
    @observable enableTerminate = false;

    @action
    setState(val) {this.state = val}

    @action
    setEnableTerminate(val) {this.enableTerminate = val}
}