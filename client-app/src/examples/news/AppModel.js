/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {HoistAppModel, XH} from '@xh/hoist/core';

import {managed} from '@xh/hoist/core';
import {NewsPanelModel} from './NewsPanelModel';


@HoistAppModel
export class AppModel {

    @managed
    newsPanelModel = new NewsPanelModel();

    get useCompactGrids() {
        return XH.getPref('defaultGridMode') == 'COMPACT';
    }
    
    async initAsync() {
        this.loadAsync();
    }

    async doLoadAsync(loadSpec) {
        await this.newsPanelModel.loadAsync(loadSpec);
    }
}
