import {HoistModel} from '@xh/hoist/core';
import {action, makeObservable, observable} from '@xh/hoist/mobx';

export class RecallsPanelModel extends HoistModel {
    @observable.ref
    testObj;

    constructor() {
        super();
        makeObservable(this);
    }

    //------------------------
    // Implementation
    //------------------------
    override async doLoadAsync(loadSpec) {
        this.setTestObj([]);
    }

    @action
    setTestObj(obj) {
        this.testObj = obj;
    }
}
