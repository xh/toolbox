import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
export class ToolbarPanelModel {
    @bindable state = null;
    @bindable enableTerminate = false;
    @bindable visible = false;
}