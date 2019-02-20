import {XH, HoistModel, LoadSupport} from '@xh/hoist/core';
import {observable} from '@xh/hoist/mobx';

@HoistModel
@LoadSupport
export class TreeGridDetailPageModel {

    @observable id;
    @observable record;

    async doLoadAsync(loadSpec) {
        return XH.portfolioService
            .getPositionAsync(this.id)
            .thenAction(record => {
                this.record = record;
                XH.appModel.navigatorModel.setTitle(record.name);
            });
    }

}