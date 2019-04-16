/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {HoistModel, LoadSupport} from '@xh/hoist/core';

@HoistModel
@LoadSupport
export class RecallsPanelModel {


    constructor() {

    }

    async doLoadAsync(loadSpec) {
        return XH
        //
        // now that I know how the backend is, I think that 'recalls'
        // is referring to our backend/recalls
            .fetchJson({url: 'recalls' , loadSpec})
            .wait(100)
            .then(rxRecallEntries => console.log(rxRecallEntries));

    }

    //------------------------
    // Implementation
    //------------------------

}