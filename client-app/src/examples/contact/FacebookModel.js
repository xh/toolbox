import {HoistModel} from '@xh/hoist/core';

export class FacebookModel extends HoistModel {
    //-------------------
    // Observable API
    //-------------------
    /** @member {Store} */
    store;

    /** @member {StoreSelectionModel} */
    selModel;


    constructor({
        store,
        selModel
    }) {
        super();

        this.store = store;
        this.selModel = selModel;
    }
}