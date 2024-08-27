import {HoistModel, managed} from '@xh/hoist/core';
import {DetailsPanelModel} from './detail/DetailsPanelModel';

export class RecallsPanelModel extends HoistModel {
    @managed
    detailsPanelModel = new DetailsPanelModel();

    //------------------------
    // Implementation
    //------------------------
    override async doLoadAsync(loadSpec) {
        this.detailsPanelModel.loadAsync();
    }
}
