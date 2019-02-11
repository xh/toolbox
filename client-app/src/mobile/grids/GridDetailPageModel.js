import {HoistModel} from '@xh/hoist/core';
import {observable} from '@xh/hoist/mobx';

@HoistModel
export class GridDetailPageModel {

    @observable record;

    constructor({record}) {
        this.record = record;
    }

}