import {HoistModel} from '@xh/hoist/core/index';
import {bindable} from '@xh/hoist/mobx/index';

@HoistModel
export class ToolbarPanelModel {
    @bindable state = null;
    @bindable enableTerminate = false;
    @bindable visible = false;
}