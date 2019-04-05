import {XH, HoistModel, LoadSupport} from '@xh/hoist/core';
import {settable, observable} from '@xh/hoist/mobx';

@HoistModel
@LoadSupport
export class TreeGridDetailPageModel {

    id;
    @settable @observable.ref record;

    constructor({id}) {
        this.id = decodeURIComponent(id);
    }

    async doLoadAsync(loadSpec) {
        const record = await XH.portfolioService.getPositionAsync(this.id);
        this.setRecord(record);
    }
}