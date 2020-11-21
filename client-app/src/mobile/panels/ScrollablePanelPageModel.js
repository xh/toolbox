import {HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';

export class ScrollablePanelPageModel extends HoistModel {

    @bindable
    showLongContent = false;

    constructor() {
        super();
        makeObservable(this);
    }
}