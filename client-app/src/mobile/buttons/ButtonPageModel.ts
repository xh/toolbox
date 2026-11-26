import type {Intent} from '@xh/hoist/core';
import {HoistModel, TaskObserver, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';

export class ButtonPageModel extends HoistModel {
    @bindable accessor intent: Intent = null;
    @bindable accessor disabled: boolean = false;
    @bindable accessor active: boolean = false;
    @bindable accessor toolbar: boolean = false;
    @bindable accessor activeButton: 'v1' | 'v2' | 'v3' = 'v1';

    /** Tracks the demo save, so its buttons show a spinner while it runs. */
    saveTask = TaskObserver.trackLast();

    async saveAsync() {
        await wait(2000).linkTo(this.saveTask);
        XH.toast({message: 'Saved'});
    }
}
