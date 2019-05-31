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

    get classificationDetails() {
        const {classification} = this.currentRecord;
        switch (classification) {
            case 'Class I':
                return 'Class I: A dangerous or defective product that could cause serious health problems or death.';
            case 'Class II':
                return 'Class II: A product that might cause a temporary health problem, or pose slight threat of a serious nature.';
            case 'Class III':
                return 'Class III: A products that is unlikely to cause any adverse health reaction, but that violates FDA labeling or manufacturing laws.';
            default:
                return classification;
        }
    }
}