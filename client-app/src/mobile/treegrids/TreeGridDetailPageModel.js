import {XH, HoistModel, LoadSupport} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
@LoadSupport
export class TreeGridDetailPageModel {

    id;
    @bindable.ref record;

    constructor({id}) {
        this.id = decodeURIComponent(id);
    }

    async doLoadAsync(loadSpec) {
        const record = await XH.portfolioService.getPositionAsync(this.id);
        this.setRecord(record);
    }
}