import {HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';

export class ToolbarPanelModel extends HoistModel {
    @bindable state = null;
    @bindable enableTerminate = false;
    @bindable visible = false;
    @bindable compact = false;

    constructor() {
        super();
        makeObservable(this);
    }
}
