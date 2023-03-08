import {HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';

export class ScrollablePanelPageModel extends HoistModel {
    @bindable
    showLongContent: boolean = false;

    constructor() {
        super();
        makeObservable(this);
    }
}
