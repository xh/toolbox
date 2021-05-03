import {HoistModel} from '@xh/hoist/core';
import {makeObservable, observable} from '@xh/hoist/mobx';

export class FacebookModel extends HoistModel {
    //-------------------
    // Public properties
    //-------------------

    //-------------------
    // Observable API
    //-------------------
    @observable.ref
    contacts

    constructor() {
        super();
        makeObservable(this);
    }

    //--------------------
    // Public Methods
    //--------------------
    loadData(arr) {
        this.contacts = [...arr]
    }
    //--------------------
    // Implementation
    //--------------------
}