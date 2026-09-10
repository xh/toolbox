import {RelativeTimestampOptions} from '@xh/hoist/cmp/relativetimestamp';
import {HoistModel} from '@xh/hoist/core';
import {action, bindable} from '@xh/hoist/mobx';
import {isUndefined, omitBy} from 'lodash';

/** Mirrors the component's own default, so the snippet can omit a matching value. */
const DEFAULT_EPSILON = 10;

export class RelativeTimestampPanelModel extends HoistModel {
    // RelativeTimestampOptions
    @bindable accessor allowFuture: RelativeTimestampOptions['allowFuture'] = true;
    @bindable accessor short: RelativeTimestampOptions['short'];
    @bindable accessor futureSuffix: RelativeTimestampOptions['futureSuffix'];
    @bindable accessor pastSuffix: RelativeTimestampOptions['pastSuffix'];
    @bindable accessor equalString: RelativeTimestampOptions['equalString'];
    @bindable accessor epsilon: RelativeTimestampOptions['epsilon'] = DEFAULT_EPSILON;
    @bindable accessor emptyResult: RelativeTimestampOptions['emptyResult'] = '';
    @bindable accessor prefix: RelativeTimestampOptions['prefix'] = '';
    @bindable accessor relativeTo: RelativeTimestampOptions['relativeTo'];
    @bindable accessor localDateMode: RelativeTimestampOptions['localDateMode'] = null;

    /** The target timestamp rendered relative to "now". */
    @bindable.ref accessor timestamp: Date = new Date();

    /**
     * The display options every instance on the page spreads, and the single source for the
     * Playground snippet - so the code shown cannot drift from the output rendered beside it.
     *
     * Undefined entries are stripped rather than passed. `getRelativeTimestamp` resolves its
     * defaults by spreading the caller's options OVER them, so an own key valued `undefined`
     * overwrites the default instead of falling back to it - which silently drops the suffixes,
     * `equalString`, and the `epsilon` equality window. Components that destructure their
     * defaults, such as Clock, do not have this hazard.
     */
    get options(): RelativeTimestampOptions {
        const {
            allowFuture,
            short,
            prefix,
            futureSuffix,
            pastSuffix,
            equalString,
            epsilon,
            emptyResult,
            relativeTo,
            localDateMode
        } = this;
        return omitBy(
            {
                allowFuture: allowFuture || undefined,
                short: short || undefined,
                prefix: prefix || undefined,
                futureSuffix: futureSuffix || undefined,
                pastSuffix: pastSuffix || undefined,
                equalString: equalString || undefined,
                epsilon: epsilon !== DEFAULT_EPSILON ? epsilon : undefined,
                emptyResult: emptyResult || undefined,
                relativeTo: relativeTo ?? undefined,
                localDateMode: localDateMode ?? undefined
            },
            isUndefined
        );
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
