import {HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {usStates} from '../../core/data';

export class ToolbarPageModel extends HoistModel {
    @bindable state: string;

    constructor() {
        super();
        makeObservable(this);
    }

    get options() {
        return usStates.map(it => it.label);
    }
}
