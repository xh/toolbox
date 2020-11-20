import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {usStates} from '../../core/data';

export class ToolbarPageModel extends HoistModel {

    @bindable state;

    get options() {
        return usStates.map(it => it.label);
    }

}