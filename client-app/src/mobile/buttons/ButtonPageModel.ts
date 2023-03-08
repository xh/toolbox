import {HoistModel, Intent} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';

export class ButtonPageModel extends HoistModel {
    @bindable intent: Intent = null;
    @bindable disabled: boolean = false;
    @bindable active: boolean = false;
    @bindable toolbar: boolean = false;
    @bindable activeButton: 'v1' | 'v2' | 'v3' = 'v1';

    constructor() {
        super();
        makeObservable(this);
    }
}
