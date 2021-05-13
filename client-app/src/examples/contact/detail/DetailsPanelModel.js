import {HoistModel} from '@xh/hoist/core';
import {makeObservable, observable, bindable} from '@xh/hoist/mobx';

export class DetailsPanelModel extends HoistModel {

    @observable
    profilePicture

    @bindable
    currentRecord

    constructor() {
        super();
        makeObservable(this);
    }

}
