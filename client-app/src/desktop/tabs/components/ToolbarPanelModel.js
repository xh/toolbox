/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {setter, observable} from 'hoist/mobx';
import {usStates} from '../../../data';

export class ToolbarPanelModel {
    @setter @observable state = null;
    options = usStates;
}