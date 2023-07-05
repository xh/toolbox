import {HoistModel} from '@xh/hoist/core';
import {makeObservable, bindable} from '@xh/hoist/mobx';
import {StoreRecord} from '@xh/hoist/data';

export class DetailsPanelModel extends HoistModel {
    @bindable.ref
    currentRecord: StoreRecord;

    constructor() {
        super();
        makeObservable(this);
    }

    get classificationDetails() {
        const {classification} = this.currentRecord.data;
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
