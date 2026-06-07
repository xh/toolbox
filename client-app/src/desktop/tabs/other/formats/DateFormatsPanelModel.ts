import {code} from '@xh/hoist/cmp/layout';
import {HoistModel} from '@xh/hoist/core';
import * as formatFunctions from '@xh/hoist/format/FormatDate';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import moment from 'moment';

export class DateFormatsPanelModel extends HoistModel {
    testData = [
        moment().toDate(),
        moment().add(-3, 'days').toDate(),
        moment().add(-3, 'months').toDate(),
        moment('2020-01-20 12:00').toDate(),
        moment(0).toDate(),
        moment('1969-07-20 04:17').toDate(),
        moment('1776-07-04').toDate(),
        null,
        undefined
    ];

    @bindable fnName = 'fmtDate';
    @bindable fmt: string = null;
    @bindable nullDisplay: string = null;
    @bindable tooltip = false;

    @bindable.ref tryItData = new Date();

    get testResults() {
        return this.testData.map(data => ({
            data,
            formattedData: nilAwareFormat(data?.toString() ?? data),
            result: this.getResult(data)
        }));
    }

    get tryItResult() {
        return this.getResult(this.tryItData);
    }

    get enableFmt() {
        return this.fnName === 'fmtDate';
    }

    constructor() {
        super();
        makeObservable(this);
    }

    //------------------
    // Implementation
    //------------------
    private getResult(input: Date) {
        const options = {
            tooltip: this.tooltip ? d => `${d}` : undefined,
            fmt: this.enableFmt && this.fmt ? this.fmt : undefined,
            nullDisplay: this.nullDisplay != null ? this.nullDisplay : undefined
        };

        try {
            return formatFunctions[this.fnName](input, options);
        } catch (e) {
            this.logError(e);
            return '#exception#';
        }
    }
}

function nilAwareFormat(val: any) {
    if (val === undefined) return code('undefined');
    if (val === null) return code('null');
    return val;
}
