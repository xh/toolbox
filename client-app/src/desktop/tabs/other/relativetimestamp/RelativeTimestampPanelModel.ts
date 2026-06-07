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

    /** The target timestamp rendered relative to "now". */
    @bindable.ref timestamp: Date = new Date();

    constructor() {
        super();
        makeObservable(this);
    }

    @action
    setToNow() {
        this.timestamp = new Date();
    }

    /** Set the target timestamp to an offset (in ms) from now - negative for the past. */
    @action
    setOffset(ms: number) {
        this.timestamp = new Date(Date.now() + ms);
    }
}
