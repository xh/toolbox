import {XH, HoistModel} from '@xh/hoist/core';
import {observable} from '@xh/hoist/mobx';
import {PendingTaskModel} from '@xh/hoist/utils/async';

@HoistModel
export class TreeGridDetailPageModel {

    loadModel = new PendingTaskModel();

    @observable id;
    @observable record;

    constructor({id}) {
        this.id = id;
        this.loadAsync();
    }

    loadAsync() {
        return XH.portfolioService
            .getPositionAsync(this.id)
            .thenAction(record => {
                this.record = record;
                XH.appModel.navigatorModel.setTitle(record.name);
            }).linkTo(this.loadModel);
    }

}