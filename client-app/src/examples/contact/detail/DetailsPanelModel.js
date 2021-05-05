import {HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';

export class DetailsPanelModel extends HoistModel {

    @bindable.ref currentRecord;

    constructor() {
        super();
        makeObservable(this);
    }
}
