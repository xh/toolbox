import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';

export class ToolbarPanelModel extends HoistModel {
    @bindable accessor state = null;
    @bindable accessor enableTerminate = false;
    @bindable accessor visible = false;
    @bindable accessor compact = false;
}
