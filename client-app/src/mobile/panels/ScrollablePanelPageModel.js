import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
export class ScrollablePanelPageModel {

    @bindable
    showLongContent = false;

}