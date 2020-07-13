import {HoistAppModel, managed, XH} from '@xh/hoist/core';
import {NewsPanelModel} from './NewsPanelModel';

@HoistAppModel
export class AppModel {

    @managed
    newsPanelModel;

    get gridSizingMode() {
        return XH.getPref('gridSizingMode');
    }
    
    async initAsync() {
        this.newsPanelModel = new NewsPanelModel();
        this.loadAsync();

    }

    async doLoadAsync(loadSpec) {
        await this.newsPanelModel.loadAsync(loadSpec);
    }
}
