import {HoistModel} from '@xh/hoist/core';
import {makeObservable, observable, action} from '@xh/hoist/mobx';

export class DetailsPanelModel extends HoistModel {
    @observable.ref
    testObj;

    constructor() {
        super();
        makeObservable(this);
    }

    override async doLoadAsync(loadSpec) {
        this.setTestObj([]);
    }

    @action
    setTestObj(obj) {
        console.log('setting obesrvable object');
        this.testObj = obj;
    }
}
