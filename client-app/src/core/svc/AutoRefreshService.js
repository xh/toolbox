import {HoistService, managed, XH} from '@xh/hoist/core';
import {Timer} from '@xh/hoist/utils/async';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {bindable} from '@xh/hoist/mobx';

@HoistService
export class AutoRefreshService {

    @managed
    timer;

    @bindable
    interval = XH.getPref('autoRefreshSecs')

    //---------------------
    // Implementation
    //---------------------
    initAsync() {
        this.timer = Timer.create({
            runFn: () => XH.refreshContextModel.autoRefreshAsync(),
            interval: this.interval * SECONDS
        });
        this.addReaction({track: () => this.interval, run: this.adjustTimer});
    }

    adjustTimer() {
        XH.setPref('autoRefreshSecs', this.interval);
        this.timer.setInterval(this.interval * SECONDS);
    }
}