import {HoistModel} from '@xh/hoist/core/index';
import {action, observable} from '@xh/hoist/mobx/index';

@HoistModel
export class ToolbarPanelModel {
    @observable state = null;
    @observable enableTerminate = false;

    @action
    setState(val) {this.state = val}

    @action
    setEnableTerminate(val) {this.enableTerminate = val}
}