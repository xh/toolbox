import {HoistModel, Intent} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';

export class ButtonPageModel extends HoistModel {
    @bindable accessor intent: Intent = null;
    @bindable accessor disabled: boolean = false;
    @bindable accessor active: boolean = false;
    @bindable accessor toolbar: boolean = false;
    @bindable accessor activeButton: 'v1' | 'v2' | 'v3' = 'v1';
}
