import {HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';

export class ButtonPageModel extends HoistModel {

    @bindable intent = null;
    @bindable disabled = false;
    @bindable active = false;
    @bindable toolbar = false;
    @bindable enablemulti = false;
    @bindable activeButton = 'v1';

    constructor() {
        super();
        makeObservable(this);
    }
}