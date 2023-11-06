import {RelativeTimestampOptions} from '@xh/hoist/cmp/relativetimestamp';
import {HoistModel} from '@xh/hoist/core';
import {action, bindable, makeObservable} from '@xh/hoist/mobx';

export class RelativeTimestampPanelModel extends HoistModel {
    // RelativeTimestampOptions
    @bindable allowFuture: RelativeTimestampOptions['allowFuture'] = true;
    @bindable short: RelativeTimestampOptions['short'];
    @bindable futureSuffix: RelativeTimestampOptions['futureSuffix'];
    @bindable pastSuffix: RelativeTimestampOptions['pastSuffix'];
    @bindable equalString: RelativeTimestampOptions['equalString'];
    @bindable epsilon: RelativeTimestampOptions['epsilon'] = 10;
    @bindable emptyResult: RelativeTimestampOptions['emptyResult'] = '';
    @bindable prefix: RelativeTimestampOptions['prefix'] = '';
    @bindable relativeTo: RelativeTimestampOptions['relativeTo'];
    @bindable localDateMode: RelativeTimestampOptions['localDateMode'] = null;

    @bindable currentTimestamp: Date = new Date();
    @bindable pastTimestamp: Date;
    @bindable futureTimestamp: Date;

    @bindable lastFocusedControl = 'setToNow';

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

    constructor() {
        super();
        makeObservable(this);
    }

    @action
    setToNow() {
        this.lastFocusedControl = 'setToNow';
        this.pastTimestamp = this.futureTimestamp = null;
        this.currentTimestamp = new Date();
    }
}
