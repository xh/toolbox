/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {HoistModel} from '@xh/hoist/core';
import {action, observable} from '@xh/hoist/mobx';

@HoistModel
export class DetailsPanelModel {

    @observable.ref
    currentRecord = null;

    @action
    setRecord(rec) {
        this.currentRecord = rec;
    }


}