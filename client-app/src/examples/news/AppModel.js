import {HoistAppModel, XH} from '@xh/hoist/core';

import {managed} from '@xh/hoist/core';
import {NewsPanelModel} from './NewsPanelModel';


@HoistAppModel
export class AppModel {

    @managed
    newsPanelModel = new NewsPanelModel();

    get gridSizingMode() {
        return XH.getPref('gridSizingMode');
    }
    
    async initAsync() {
        this.loadAsync();
    }

    async doLoadAsync(loadSpec) {
        await this.newsPanelModel.loadAsync(loadSpec);
    }
}
