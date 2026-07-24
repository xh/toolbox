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

    /** The target timestamp rendered relative to "now". */
    @bindable.ref accessor timestamp: Date = new Date();

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
