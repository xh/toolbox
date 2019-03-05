import {XH, HoistModel, LoadSupport} from '@xh/hoist/core';
import {settable, observable} from '@xh/hoist/mobx';

@HoistModel
@LoadSupport
export class TreeGridDetailPageModel {

    id;
    @settable @observable.ref record;

    constructor({id}) {
        this.id = id;
    }

    async doLoadAsync(loadSpec) {
        const record = await XH.portfolioService.getPositionAsync(this.id);
        this.setRecord(record);
        XH.appModel.navigatorModel.setTitle(record.name);
    }
}