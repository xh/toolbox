import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';

export class ScrollablePanelPageModel extends HoistModel {

    @bindable
    showLongContent = false;

}