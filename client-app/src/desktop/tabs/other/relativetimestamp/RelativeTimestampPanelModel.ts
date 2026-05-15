import {RelativeTimestampOptions} from '@xh/hoist/cmp/relativetimestamp';
import {HoistModel} from '@xh/hoist/core';
import {action, bindable} from '@xh/hoist/mobx';

export class RelativeTimestampPanelModel extends HoistModel {
    // RelativeTimestampOptions
    @bindable accessor allowFuture: RelativeTimestampOptions['allowFuture'] = true;
    @bindable accessor short: RelativeTimestampOptions['short'];
    @bindable accessor futureSuffix: RelativeTimestampOptions['futureSuffix'];
    @bindable accessor pastSuffix: RelativeTimestampOptions['pastSuffix'];
    @bindable accessor equalString: RelativeTimestampOptions['equalString'];
    @bindable accessor epsilon: RelativeTimestampOptions['epsilon'] = 10;
    @bindable accessor emptyResult: RelativeTimestampOptions['emptyResult'] = '';
    @bindable accessor prefix: RelativeTimestampOptions['prefix'] = '';
    @bindable accessor relativeTo: RelativeTimestampOptions['relativeTo'];
    @bindable accessor localDateMode: RelativeTimestampOptions['localDateMode'] = null;

    @bindable accessor currentTimestamp: Date = new Date();
    @bindable accessor pastTimestamp: Date;
    @bindable accessor futureTimestamp: Date;

    @bindable accessor lastFocusedControl = 'setToNow';

    get timestamp() {
        switch (this.lastFocusedControl) {
            case 'futureDatePicker':
                return this.futureTimestamp;
            case 'pastDatePicker':
                return this.pastTimestamp;
            default:
                return this.currentTimestamp;
        }
    }

    @action
    setToNow() {
        this.lastFocusedControl = 'setToNow';
        this.pastTimestamp = this.futureTimestamp = null;
        this.currentTimestamp = new Date();
    }
}
