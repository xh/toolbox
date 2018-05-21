/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {HoistModel} from '@xh/hoist/core';
import {setter, observable} from '@xh/hoist/mobx';
import {usStates} from '../../../data';

@HoistModel()
export class ToolbarPanelModel {
    @setter @observable state = null;
    options = usStates;
}