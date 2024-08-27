import {HoistModel} from '@xh/hoist/core';

export class DetailsPanelModel extends HoistModel {
    get testObj() {
        return this.componentProps.testObj;
    }
}
